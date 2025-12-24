#include "masterAgent.h"


masterAgent::masterAgent()
{

}

masterAgent::~masterAgent()
{

}

void masterAgent::Connect_SimManager(sim_manager* sim_manager)
{
    _sim_manager = sim_manager;
    RestAPI_Run();

}

void masterAgent::RestAPI_Run()
{
    http_listener_config cfg;
    cfg.set_timeout(utility::seconds(180));

    http_listener listener(U("http://220.124.222.89:8083"), cfg);

    listener.support(methods::GET, [=](http_request req) {

        auto uri = req.relative_uri();
        auto path = uri.path();
        auto query = uri.query();


        std::wcout << "Path : " << path << std::endl;
        std::wcout << "Query: " << query << std::endl;

        if (path == U("/api/sim/run"))
        {
            auto queryMap = uri::split_query(query);
            std::string id = utility::conversions::to_utf8string(queryMap[U("id")]);
            std::string projectname = utility::conversions::to_utf8string(queryMap[U("projectname")]);
            double end_t = 60;
            end_t = std::stod(queryMap[U("end_t")]);

            _sim_manager->set_callback(id, projectname, end_t);

            req.reply(status_codes::OK, U("Simulation Started"));
        }
        else
        {
            req.reply(status_codes::NotFound, U("Invalid URL"));
        }
        });

    try {
        listener.open().wait();
        std::cout << "REST 서버 실행됨: http://220.124.222.89:8083" << std::endl;

        // 서버가 꺼지지 않도록 무한 대기
        while (true)
            std::this_thread::sleep_for(std::chrono::seconds(1));
    }
    catch (const std::exception& e) {
        std::cout << "서버 에러 발생" << std::endl;
        std::cerr << e.what() << std::endl;
    }
}