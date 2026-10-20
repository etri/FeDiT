#include "masterAgent.h"
#include <memory>
#include <cmath>
#include <stdexcept>


masterAgent::masterAgent()
{

}

masterAgent::~masterAgent()
{

}

void masterAgent::Connect_SimManager(sim_manager* sim_manager, unsigned short listen_port)
{
    _sim_manager = sim_manager;
    RestAPI_Run(listen_port);

}

void masterAgent::RestAPI_Run(unsigned short listen_port)
{
    http_listener_config cfg;
    cfg.set_timeout(utility::seconds(180));

    // Bind candidates, tried in order.
    // The reverse proxy (Nginx container) reaches this listener through
    // host.docker.internal, so a wildcard bind is required; loopback is the
    // last resort for a local-only run.
    // A wildcard bind needs a one-time URL reservation on Windows:
    //   netsh http add urlacl url=http://+:8084/ user=Everyone
    const utility::string_t bind_candidates[] = {
        U("http://+:") + std::to_wstring(listen_port),
        U("http://0.0.0.0:") + std::to_wstring(listen_port),
        U("http://localhost:") + std::to_wstring(listen_port)
    };

    // Observe reply tasks as well: a disconnected HTTP client must not leave
    // an unobserved task exception that terminates the process.
    auto reply = [](http_request req, status_code code, const utility::string_t& body) {
        try {
            req.reply(code, body).then([](pplx::task<void> completed) {
                try { completed.get(); }
                catch (const std::exception& e) { std::cerr << "REST reply failed: " << e.what() << std::endl; }
                catch (...) { std::cerr << "REST reply failed" << std::endl; }
            });
        }
        catch (...) { std::cerr << "REST reply could not be sent" << std::endl; }
    };
    auto rest_get_handler = [this, reply](http_request req) {
        try {
            const auto request_uri = req.relative_uri();
            if (request_uri.path() != U("/api/sim/run")) {
                reply(req, status_codes::NotFound, U("Invalid URL"));
                return;
            }
            const auto query = uri::split_query(request_uri.query());
            auto required = [&query](const utility::string_t& key) {
                auto it = query.find(key);
                if (it == query.end() || it->second.empty())
                    throw std::invalid_argument("Missing query parameter");
                return uri::decode(it->second);
            };
            const auto id = utility::conversions::to_utf8string(required(U("id")));
            const auto project = utility::conversions::to_utf8string(required(U("projectname")));
            const auto end_text = required(U("end_t"));
            size_t consumed = 0;
            const double end = std::stod(end_text, &consumed);
            if (consumed != end_text.size() || !std::isfinite(end) || end < 0)
                throw std::invalid_argument("Invalid end_t");
            if (!_sim_manager) {
                reply(req, status_codes::ServiceUnavailable, U("Simulation manager unavailable"));
                return;
            }
            if (!_sim_manager->set_callback(id, project, end)) {
                reply(req, status_codes::NotFound, U("GUI client not connected"));
                return;
            }
            reply(req, status_codes::OK, U("Simulation Started"));
        }
        catch (const std::invalid_argument& e) {
            std::cerr << "REST invalid request: " << e.what() << std::endl;
            reply(req, status_codes::BadRequest, U("Invalid or missing query parameter"));
        }
        catch (const std::out_of_range& e) {
            std::cerr << "REST invalid number: " << e.what() << std::endl;
            reply(req, status_codes::BadRequest, U("end_t is out of range"));
        }
        catch (const std::exception& e) {
            std::cerr << "REST request failed: " << e.what() << std::endl;
            reply(req, status_codes::InternalError, U("Request failed"));
        }
        catch (...) {
            std::cerr << "REST request failed: unknown exception" << std::endl;
            reply(req, status_codes::InternalError, U("Request failed"));
        }
    };

    for (const auto& bind_uri : bind_candidates) {
        try {
            std::unique_ptr<http_listener> l(new http_listener(bind_uri, cfg));
            l->support(methods::GET, rest_get_handler);
            l->open().wait();
            _listener = std::move(l);
            std::wcout << U("REST API listening on ") << bind_uri << U("  (GET /api/sim/run)") << std::endl;
            break;
        }
        catch (const std::exception& e) {
            std::wcout << U("REST API bind failed : ") << bind_uri << std::endl;
            std::cerr << "  reason : " << e.what() << std::endl;
        }
    }

    if (!_listener) {
        std::cout << "REST API disabled : could not bind TCP port " << listen_port << std::endl;
        std::cout << "  - check that no other process uses " << listen_port << std::endl;
        std::cout << "  - run as administrator, or reserve the URL once :" << std::endl;
        std::cout << "    netsh http add urlacl url=http://+:" << listen_port << "/ user=Everyone" << std::endl;
        return;
    }

    // The listener serves on its own threads. Returning here lets main()
    // reach commandLineLoop(), which used to be unreachable because this
    // function blocked forever.
}

void masterAgent::RestAPI_Stop()
{
    if (_listener) {
        try {
            _listener->close().wait();
        }
        catch (const std::exception& e) {
            std::cerr << "REST API close failed : " << e.what() << std::endl;
        }
        _listener.reset();
    }
}
