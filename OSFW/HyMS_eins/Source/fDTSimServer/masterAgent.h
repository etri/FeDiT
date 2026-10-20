#pragma once
#include "../common/common.h"
#include "sim_manager.h"
#include <cpprest/http_listener.h>
#include <memory>
using namespace web;
using namespace web::http;
using namespace web::http::experimental::listener;

class masterAgent
{
private:
	sim_manager* _sim_manager = nullptr;
	// REST listener must outlive RestAPI_Run() so the server keeps answering
	// while the console command loop runs.
	std::unique_ptr<http_listener> _listener;

	string end_t;
	string start_t;
	string project_name;
	string msg = "run";

public:
	masterAgent();
	~masterAgent();
	void Connect_SimManager(sim_manager* sim_manager, unsigned short listen_port = 8084);

	void RestAPI_Run(unsigned short listen_port = 8084);
	void RestAPI_Stop();
};

