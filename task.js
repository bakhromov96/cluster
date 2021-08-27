process.on('message', (message) => {
  if (message == 'RESTART') {
    console.log(`Child process received ${message} message with `,process.pid);
    process.disconnect();
  }
  else if(message == 'STOP'){
    console.log(`Child process received ${message} message with `,process.pid);
    process.disconnect();
  }
  else if(message == 'START'){
    console.log('Worker with pid : %d is started working', process.pid);
  }
});

process.on('SIGINT', (signal) => {
  console.log(`Child process received ${signal} message with `,process.pid);
  process.disconnect();
});