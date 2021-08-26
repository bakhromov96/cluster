// Класс является сервером обработки запросов.
// в конструкторе передается транспорт, и настройки кластеризации
// сервер может работать как в одном процессе так и порождать для обработки запросов дочерние процессы.
// Задача дописать недостающие части и отрефакторить существующий код.
// Использовать функционал модуля cluster - не лучшая идея. Предпочтительный вариант - порождение процессов через child_process
// Мы ожидаем увидеть реализацию работы с межпроцессным взаимодействием в том виде, в котором вы сможете. 
// Контроль жизни дочерних процессов должен присутствовать в качестве опции. 
// Должна быть возможность включать\отключать пересоздание процессов в случае падения 
// Предпочтительно увидеть различные режимы балансировки входящих запросов.
//
// Не важно, http/ws/tcp/ или простой сокет это все изолируется в транспорте.
// Единственное что знает сервис обработки запросов это тип подключения транспорта, постоянный или временный
// и исходя из этого создает нужную конфигурацию. ну и еще от того какой режим кластеризации был выставлен
// В итоговом варианте ожидаем увидеть код в какой-либо системе контроля версия (github, gitlab) на ваш выбор
// Примеры использования при том или ином транспорте
// Будет плюсом, если задействуете в этом деле typescript и статическую типизацию.
// Вам не нужна привязка к каким-либо фрэймворкам или нестандартным библиотекам. Все реализуется при помощи встроенных модулей nodejs
// Если вам что-то не понятно, задавайте вопросы.
// Если вы не умеете применять принципы ООП, не начинайте задание
// Если вы не готовы тратить время на задачу, говорите об этом сразу и не приступайте к выполнению.

class Service {
    constructor(options) {
        
        this.transport = options.transport;
        this.isClusterMode = !!options.cluster;
        if( this.isClusterMode ) {
            this.clusterOptions = options.cluster;
        }
        this.workerCount = process.env.WORKER_COUNT || 2; // declaring number of workers
        this.stopTriger = false; // 
        this.workersToStop = [];
        this.PORT = 3000;
        this.server;
    }

    async start() {
        
        if( this.isClusterMode ) {
        
            if( this.clusterOptions.isMaster) {
        
                await this.startCluster();
        
                if( this.transport.isPermanentConnection ) {
                    await this.startTransport();
                }
        
            }
            else {
        
                await this.startWorker();
        
                if( !this.transport.isPermanentConnection ) {
                    await this.startTransport();
                }
        
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
        
        console.log('Worker with pid : %d is started working and listening on PORT : %d', process.pid, this.PORT);
    }

    /* This function is called when isMaster return true, then childs are forked*/
    async startCluster() {
        //todo: логика запуска дочерних процессов
        
        for (var i = await this.workersCount(); i < this.workerCount; i++) {
            this.clusterOptions.fork(); 
        }
        
        console.log('Master with pid : ', process.pid, ' booted');

        // A worker has disconnected either because the process was killed
        // or we are processing the workersToStop array restarting each process
        // In either case, we will fork any workers needed
        this.clusterOptions.on('exit',async (worker,code,signal) => {
            if(worker.state == 'dead'){
                console.log('Worker was killed by signal');
                this.forkingNewWorkers();
            }
        });

        // HUP signal sent to the master process to start restarting all the workers sequentially
        process.on('SIGHUP',() => {
            this.restartingAllWorkers();
        });

        // Kill all the workers at once
        process.on('SIGTERM',() => {
            this.stoppingAllWorkers();
        });
    }
    
    /* This function for creating workers*/
    async forkingNewWorkers(){
        try{
            if (!this.stopTriger) {
                for (var i = await this.workersCount(); i < this.workerCount; i++) { this.clusterOptions.fork(); }
            }
        }
        catch(err){
            console.error(err);
        }
    }
    
    /* This function is called for stopping next worker process*/
    async stoppingNextWorker(){
        
        var arr = this.workersToStop;

        var i = arr.pop();
        
        var worker = this.clusterOptions.workers[i];
        
        if (worker) await this.stoppingWorker(worker);
    
    }
    
    /* This function is called for stopping worker process*/
    async stoppingWorker(worker){
        console.log('Worker with pid : %d is stopped', worker.process.pid);
        worker.disconnect();
        var killTimer = setTimeout(function() {
        worker.kill();
        }, 5000);
        // Ensure we don't stay up just for this setTimeout
        killTimer.unref();
    }
    
    /* This function return number of online workers*/
    async workersCount(){
        return Object.keys(this.clusterOptions.workers).length;
    }
    
    /* This function is called for restarting all workers*/
    async restartingAllWorkers(){
        console.log('Restarting all workers');
        this.workersToStop = Object.keys(this.clusterOptions.workers);
        for (var i = 0; i < this.workerCount; i++) {
            await this.stoppingNextWorker();
        }
        
    }

    /* This function is called for stopping all workers*/
    async stoppingAllWorkers(){
        console.log('Stopping all workers');
        this.stopTriger = true;
        for(var id in this.clusterOptions.workers){
           await this.stoppingWorker(this.clusterOptions.workers[id]);
        }
    }

}

module.exports.Service = Service;