# Using cluster module and child_process.fork()

Be sure you've installed `node` in your laptop.

**Open terminal in your laptop and run following commmand**
```
node index.js
```
*Time to kill child processes and send signal to Master*
**Open another terminal and try kill child process**
```
kill -9 pid
```
You can see after process has been killed, forked another process
**Send SIGHUP signal to Master for restarting all processes**
```
kill -1 pid
```
**Send SIGTERM signal to Master for stopping all processes**
```
kill -15 pid
```
