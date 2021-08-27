class Service {
    constructor(options) {
        
        this.transport = options.transport;
        this.isClusterMode = !!options.cluster;
        if( this.isClusterMode ) {
            this.clusterOptions = options.cluster;
        }
        this.PORT = 3000;
        this.server;
        this.child;
        this.stopping = false;
    }

    async start() {
        
        if( this.isClusterMode ) {
            await this.startCluster();

            await this.startWorker();

            if( !this.transport.isPermanentConnection ) {
                await this.startTransport();
            }    
        }
        else {
            await this.startWorker();
            await this.startTransport();
        }
    }
    /* This function is accepting request from clients*/
    async startTransport() {
        //todo: логика запуска транспорта
        this.server.on('request',function(req,res){
            console.log('%d request received', process.pid);
            
            res.writeHead(200, {'Content-Type': 'text/plain'});
                
            res.end('Hello world!\n');
        });        
    }
    
    /* This function is called for starting worker process*/
    async startWorker() {
        //todo: логика запуска обработчика запросов
        this.server = this.transport.createServer().listen(this.PORT);
    }

    /* This function is called when isMaster return true, then childs are forked*/
    async startCluster() {
        //todo: логика запуска дочерних процессов
        console.log('Is working');
        this.child = this.clusterOptions(__dirname + '/task');
        
        console.log('Master with pid : ', process.pid, ' booted');

        this.child.send('START');
        // A worker has disconnected either because the process was killed
        // or we are processing the workersToStop array restarting each process
        // In either case, we will fork any workers needed
        this.child.on('exit', (code,signal) => {
            console.log(`Child killed with code ${signal}`);
            this.child.kill();
            this.forkingNewWorkers();
        });

        // HUP signal sent to the master process to start restarting all the workers sequentially
        process.on('SIGHUP',() => {
            console.log('Child process is restarting');
            this.child.send('SIGINT');
            this.forkingNewWorkers();
        });

        // Kill all the workers at once
        process.on('SIGTERM',() => {
            console.log('All processes are terminated');
            this.stopping = true;
            this.child.send('SIGINT');
        });
    }
    
    /* This function for creating workers*/
    async forkingNewWorkers(){
        try{
            if(!this.stopping){
                this.child = this.clusterOptions(__dirname + '/task');  
                this.child.send('START');  
            }
        }
        catch(err){
            console.error(err);
        }
    }

}

module.exports.Service = Service;