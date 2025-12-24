#pragma once
#include "../common/common.h"
#include "sim_manager.h"
#include <cpprest/http_listener.h>
using namespace web;
using namespace web::http;
using namespace web::http::experimental::listener;

class masterAgent
{
private:
	sim_manager* _sim_manager;

	string end_t;
	string start_t;
	string project_name;
	string msg = "run";

public:
	masterAgent();
	~masterAgent();
	void Connect_SimManager(sim_manager* sim_manager);

	void RestAPI_Run();
};

