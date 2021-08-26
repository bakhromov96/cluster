const cluster = require('cluster');
const { fork } = require('child_process');
const service = require('./cluster_service.js');
const http = require('http');
let Service = service.Service;

var options = {};
options.cluster = cluster;
options.transport = http;


async function start_cluster_module(Service){
	new Service(options).start();
}

async function start_fork_child_process(Service){
	new Service(options).start();
}

start_cluster_module(Service);