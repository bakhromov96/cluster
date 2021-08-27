const cluster = require('cluster');
const { fork } = require('child_process');
const service = require('./cluster_service.js');
const service_f = require('./fork_service.js');
const http = require('http');
let Service = service.Service;
let Service_f = service_f.Service;
var options = {};
options.cluster = cluster;
options.transport = http;

var options_f = {};
options_f.cluster = fork;
options_f.transport = http;

async function start_cluster_module(Service){
	new Service(options).start();
}

async function start_fork_child_process(Service){
	new Service(options_f).start();
}

start_cluster_module(Service);

//start_fork_child_process(Service_f);