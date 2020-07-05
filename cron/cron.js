module.exports = function (RED) {
  const path = require('path');
  const template = require('./component');

  const { settings } = RED;

  function HTML(config) {
    config.adminRoot = settings.httpAdminRoot;
    config.httpNodeRoot = settings.httpNodeRoot;
    const configAsJson = JSON.stringify(config);
    return template(configAsJson);
  }

  function checkConfig(node, conf) {
    if (!conf || !conf.hasOwnProperty('group')) {
      node.error(RED._('ui_cron.error.no-group'));
      return false;
    }
    return true;
  }

  let ui = undefined;
  let done;

  function Cron(config) {
    const node = this;

    try {
      if (ui === undefined) {
        ui = RED.require('node-red-dashboard')(RED);
      }
      RED.nodes.createNode(this, config);

      if (!checkConfig(node, config)) {
        return;
      }

      const html = HTML(config);
      done = ui.addWidget({
        node,
        order: config.order,
        group: config.group,
        width: config.width,
        height: config.height,
        format: html,
        templateScope: 'local',
        emitOnlyNewValues: false,
        forwardInputMessages: false,
        storeFrontEndInputAsState: false,
        convertBack: function (value) {
          return value;
        },
        beforeEmit: function (msg, value) {
          return { msg };
        },
        beforeSend: function (msg, orig) {
          if (orig) {
            return orig.msg;
          }
        },
        initController: function ($scope, events) {
          $scope.flag = true;

          let length = Math.PI * 2 * 100;
          const timerModes = [0, 1, 2];
          let progressBar;
          let pointer;
          let pointerGroup;
          let timerModeBtns;
          let displayOutput;
          let pauseBtn;
          let setterBtns;

          $scope.init = function (config) {
            $scope.config = config;
            $scope.sensor = {};
            $scope.styles = {
              fontColor: '#1C1C1C',
              grey: '#565656',
              primaryColor: '#1dc0ff',
              secondaryColor: '#55ffb6',
              successColor: '#69ff4f',
              warningColor: '#fff62d',
              dangerColor: '#ff954d',
            };

            $scope.intervalTimer = null;
            $scope.isPaused = true;
            $scope.isStarted = false;
            $scope.wholeTime = 60 * 60;
            $scope.timeLeft = 0;
            $scope.timerOutput = 0;
            $scope.timerState = 0;
            $scope.timerMode = 1;
            $scope.isMounted = false;

            $scope.updatedWidth = () => {
              const rate = Number($scope.config.width);
              // console.log('updatedWidth', 100 * rate);
              return 300;
            };

            $scope.updatedHeight = () => {
              const rate = Number($scope.config.height);
              // console.log('updatedHeight', 100 * rate);
              return 300;
            };

            $scope.viewBox = () => {
              return `0 0 ${$scope.updatedWidth()} ${$scope.updatedHeight()}`;
            };

            $scope.timerModeStyle = () => {
              const width = $scope.updatedWidth();
              return {
                'text-shadow': `${width / 250}px ${width / 250}px ${width / 300}px #6e6e6e`,
                'font-size': `${width / 10}px`,
                fill: `${$scope.styles.primaryColor}`,
              };
            };

            $scope.timerSetterStyle = () => {
              const width = $scope.updatedWidth();
              return {
                'text-shadow': `${width / 250}px ${width / 250}px ${width / 300}px #6e6e6e`,
                'font-size': `${width / 10}px`,
                fill: `${$scope.styles.primaryColor}`,
              };
            };

            $scope.triggerButtonStyle = () => {
              const width = $scope.updatedWidth();
              return {
                'text-shadow': `${width / 150}px ${width / 150}px ${width / 200}px #6e6e6e`,
                'font-size': `${width / 10}px`,
                fill: `${$scope.styles.primaryColor}`,
              };
            };

            // $scope.isMounted = true;

            setTimeout(mount, 500);
          };

          function DeltaTimer(cb, data, interval) {
            let timeout, lastTime;
            let count = 0;

            const loop = () => {
              count += 1;
              const thisTime = +new Date();
              const deltaTime = thisTime - lastTime;
              const delay = Math.max(interval - deltaTime, 0);
              timeout = setTimeout(loop, delay);
              lastTime = thisTime + delay;
              data.delay = delay;
              data.count = count;
              data.time = thisTime;
              data.lastTime = lastTime;
              if (count > 1) {
                cb(data);
              }
            };

            const start = () => {
              timeout = setTimeout(loop, 0);
              lastTime = +new Date();
              return lastTime;
            };

            const stop = () => {
              clearTimeout(timeout);
              return lastTime;
            };

            this.start = start;
            this.stop = stop;
            return timeout;
          }

          function mount() {
            length = Math.PI * 2 * ($scope.updatedWidth() / 2.3);

            pointer = document.getElementById(`cron-dot-${$scope.$eval('$id')}`);
            progressBar = document.getElementById(`cron-progress-${$scope.$eval('$id')}`);
            displayOutput = document.getElementById(`display-remain-time-${$scope.$eval('$id')}`);
            pointerGroup = document.getElementById(`cron-pointer-${$scope.$eval('$id')}`);
            // stopBtn = document.getElementById(`break-${$scope.$eval('$id')}`);
            pauseBtn = document.getElementById(`pause-${$scope.$eval('$id')}`);

            timerModeBtns = timerModes.map((mode) =>
              document.getElementById(`timer-mode-${mode}-${$scope.$eval('$id')}`),
            );
            setterBtns = [0, 1, 2, 3].map((i) =>
              document.getElementById(`timer-setter-${i}-${$scope.$eval('$id')}`),
            );

            progressBar.style.strokeDasharray = length;
            timerModeBtns[$scope.timerMode].style.fill = $scope.styles.primaryColor;
            
            $scope.isMounted = true;

            setClock(1000);
            displayTimeLeft($scope.wholeTime);
          }

          function updateCronDisplay(value, timePercent) {
            const offset = -length - (length * value) / timePercent;
            if ($scope.isStarted && !$scope.isPaused) {
              pointer.style.stroke = $scope.styles.successColor;
              progressBar.style.stroke = '#baff00';
            }
            progressBar.style.strokeDashoffset = offset;
            pointerGroup.style.transform = `rotate(${(360 * value) / timePercent}deg)`;
          }

          function displayTimeLeft(timeLeft) {
            // let minutes = Math.floor(timeLeft / 60);
            if (displayOutput) {
              const displayString = $scope.setTimeString(timeLeft);
              displayOutput.textContent = displayString;
            }
            updateCronDisplay(timeLeft, $scope.wholeTime);
          }

          function startCron() {
            // console.log('start cron ');
            $scope.isStarted = true;
            $scope.isPaused = false;
            $scope.timerOutput = 0;
            $scope.timeLeft = $scope.wholeTime;
            $scope.intervalTimer.start();
            pointer.style.stroke = $scope.styles.successColor;
            progressBar.style.stroke = $scope.styles.successColor;
            pauseBtn.classList.remove('play');
            pauseBtn.classList.add('pause');
            setterBtns.forEach(function (btn) {
              btn.disabled = true;
              btn.style.opacity = 0.5;
            });
          }

          function restartCron() {
            // console.log('restart cron ');
            $scope.isStarted = true;
            $scope.isPaused = false;
            $scope.timerOutput = 0;
            if ($scope.timeLeft <= 0) {
              $scope.timeLeft = $scope.wholeTime;
            }
            $scope.intervalTimer.start();
            pauseBtn.classList.remove('play');
            pauseBtn.classList.add('pause');
            pointer.style.stroke = $scope.styles.successColor;
            progressBar.style.stroke = $scope.styles.successColor;
            setterBtns.forEach(function (btn) {
              btn.disabled = true;
              btn.style.opacity = 0.5;
            });
          }

          function pauseCron() {
            // console.log('pause cron');
            $scope.isStarted = true;
            $scope.isPaused = true;
            $scope.intervalTimer.stop();
            pointer.style.stroke = $scope.styles.primaryColor;
            progressBar.style.stroke = $scope.styles.primaryColor;
            pauseBtn.classList.remove('pause');
            pauseBtn.classList.add('play');
            setterBtns.forEach(function (btn) {
              btn.disabled = false;
              btn.style.opacity = 1;
            });
          }

          function stopCron() {
            // console.log('stop cron');
            $scope.isStarted = false;
            $scope.isPaused = true;
            // $scope.timeLeft = 0;
            $scope.intervalTimer.stop();
            pointer.style.stroke = $scope.styles.primaryColor;
            progressBar.style.stroke = $scope.styles.primaryColor;
            setterBtns.forEach(function (btn) {
              btn.disabled = false;
              btn.style.opacity = 1;
            });
            displayTimeLeft($scope.wholeTime);
            pauseBtn.classList.remove('pause');
            pauseBtn.classList.add('play');
          }

          function updateCron(data) {
            if ($scope.timeLeft <= 0) {
              // stopCron();
            } else if ($scope.timeLeft > 0) {
              $scope.timeLeft -= 1;
              // console.log('updateCron', $scope.timeLeft);
              displayTimeLeft($scope.timeLeft);
            }
            return data;
          }

          function setClock(interval) {
            if ($scope.intervalTimer && $scope.intervalTimer !== null) {
              $scope.intervalTimer.stop();
            }
            $scope.intervalTimer = new DeltaTimer(updateCron, {}, interval);
            return $scope.intervalTimer;
          }

          function setTopic(resource) {
            const baseTopic = `*/Sensor/PUT`;
            return `${baseTopic}/${$scope.sensor.type}/${$scope.sensor.nativeNodeId}/${$scope.sensor.nativeSensorId}/${resource}`;
          }

          function send(resource, payload) {
            $scope.send({
              //    sensor: $scope.sensor,
              resource,
              topic: setTopic(resource),
              payload,
            });
          }

          function setWholeTime(seconds) {
            if ($scope.wholeTime + seconds > 0) {
              $scope.wholeTime += seconds;
              send(5521, $scope.wholeTime);
              displayTimeLeft($scope.wholeTime);
            }
          }

          function setTimeLeft(seconds) {
            if ($scope.timeLeft + seconds > 0) {
              $scope.timeLeft += seconds;
              send(5538, $scope.timeLeft);
              displayTimeLeft(scope.timeLeft);
            }
          }

          function timeLeftUpdate(value, oldValue) {
            if (value !== oldValue && value !== null) {
              if (value < 0) value = 0;
              if (value > 0) {
                if ($scope.isStarted && !$scope.isPaused && !$scope.timerOutput) {
                  displayTimeLeft(value);
                } else if (!$scope.timerOutput && !$scope.isStarted) {
                  //  this.startCron();
                } else if (!$scope.timerOutput && $scope.isPaused) {
                  //  this.restartCron();
                }
              } else if (value === 0) {
                if ($scope.isStarted) {
                  stopCron();
                }
              }
            }
            return value;
          }

          function timerOutputUpdate(value, oldValue) {
            if (!$scope.isPaused && $scope.isStarted && (value === true || value === 1)) {
              stopCron();
              //  this.pauseCron();
            }
            return value;
          }

          function timerStateUpdate(value, oldValue) {
            // console.log('TIMER STATE CHANGED:', value, oldValue);
            if (oldValue !== value) {
              if (value === true || value === 1) {
                if (!$scope.isStarted) {
                  startCron();
                } else if ($scope.isPaused && $scope.isStarted) {
                  restartCron();
                }
              }
            }
            return value;
          }

          function timerModeUpdate(value, oldValue) {
            // console.log('TIMER MODE CHANGED:', value, oldValue);
            timerModeBtns.forEach((btn, index) => {
              if (index === value) {
                btn.style.fill = $scope.styles.primaryColor;
              } else {
                btn.style.fill = $scope.styles.secondaryColor;
              }
            });
            return value;
          }

          function eventUpdate(value, oldValue) {
            // console.log('NEW EVENT:', value, oldValue);
            switch (value) {
              case 'start':
                if (!$scope.isStarted) {
                  startCron();
                }
                break;
              case 'restart':
                if (!$scope.isStarted) {
                  restartCron();
                }
                break;
              case 'stop':
                if ($scope.isStarted) {
                  stopCron();
                }
                break;
              case 'pause':
                if ($scope.isStarted && !$scope.isPaused) {
                  pauseCron();
                }
                break;
            }
            return value;
          }

          function wholeTimeUpdate(value, oldValue) {
            if (value !== null) {
              if (value < 0) value = 0;
              if (!$scope.isStarted) {
                displayTimeLeft(value);
              }
              return value;
            }
            return 0;
          }

          $scope.setTimerMode = (mode) => {
            if ($scope.isStarted) {
              return;
            }
            switch (mode) {
              case 0:
                $scope.timerMode = 0;
                break;
              case 1:
                $scope.timerMode = 1;
                break;
              case 2:
                $scope.timerMode = 2;
                break;
              default:
                throw new Error('Unsupported mode');
            }
            send(5526, mode);
          };

          $scope.setTimer = (seconds) => {
            if ($scope.isStarted && $scope.isPaused) {
              setTimeLeft(seconds);
            } else if (!$scope.isStarted && $scope.isPaused) {
              setWholeTime(seconds);
            }
          };

          function getMinutes(timeLeft) {
            if (isNaN(timeLeft)) {
              return 0;
            }
            const minutes = Math.floor(timeLeft / 60);

            return typeof minutes !== 'number' || minutes < 0 || minutes > 500 ? 0 : minutes;
          }

          function getSeconds(timeLeft) {
            if (isNaN(timeLeft)) {
              return 0;
            }
            const seconds = timeLeft % 60;
            return typeof seconds !== 'number' || seconds < 0 || seconds > 59 ? 0 : seconds;
          }

          $scope.setTimeString = (timeLeft) => {
            const minutes = getMinutes(timeLeft);
            const seconds = getSeconds(timeLeft);
            return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
          };

          $scope.switchButtonClass = () =>
            $scope.timerState ? `switch-button switched-on` : `switch-button switched-off`;

          $scope.playButton = () => {
            return $scope.isStarted && !$scope.isPaused ? '▮▮' : '▶';
          };

          $scope.stopTimer = () => {
            //  scope.timerState = 0;
            send(5523, 'stop');
            stopCron();
          };

          $scope.pauseTimer = () => {
            const resource = 5523;
            if (!$scope.isStarted && $scope.isPaused) {
              send(resource, 'start');
              startCron();
            } else if ($scope.isPaused && $scope.isStarted) {
              //  $scope.timerState = 1;
              send(resource, 'restart');
              restartCron();
            } else if (!$scope.isPaused && $scope.isStarted) {
              //  $scope.timerState = 0;
              send(resource, 'pause');
              pauseCron();
            }
          };

          $scope.editTimerField = () => {
            if (!$scope.isStarted && $scope.isMounted) {
              // const text = this.timerClock;
              // if (text && text.id) {
              //   const newValue = prompt(
              //     `Please enter new time : `,
              //     this.setTimeString(this.wholeTime),
              //   );
              //   if (newValue && newValue !== null) {
              //     let timeIsValid = true;
              //     const parts = newValue.split(':');
              //     const seconds = Number(parts[1]);
              //     if (typeof seconds !== 'number' || seconds < 0 || seconds > 59) {
              //       timeIsValid = false;
              //     }
              //     const minutes = Number(parts[0]);
              //     if (typeof minutes !== 'number' || minutes < 0 || minutes > 500) {
              //       timeIsValid = false;
              //     }
              //     if (timeIsValid) {
              //       const timeLeft = minutes * 60 + seconds;
              //       if (this.isPaused) {
              //         this.updateSetting(this.updatedSensor, 5538, timeLeft);
              //       } else {
              //         this.updateSetting(this.updatedSensor, 5521, timeLeft);
              //       }
              //     }
              //   }
              // }
            }
          };

          $scope.$watch('msg', function (msg) {
            if (!msg || !msg.payload || !msg.payload.id || !$scope.isMounted) {
              return;
            }
            console.log('cron update', msg.payload, msg.method);
            $scope.sensor = msg.payload;

            $scope.wholeTime = wholeTimeUpdate($scope.sensor.resources['5521'], $scope.wholeTime);

            if (msg.method === 'PUT' || msg.method === 'POST') {
              $scope.event = eventUpdate($scope.sensor.resources['5523'], $scope.event);
              $scope.timeLeft = timeLeftUpdate($scope.sensor.resources['5538'], $scope.timeLeft);
              $scope.timerOutput = timerOutputUpdate(
                $scope.sensor.resources['5543'],
                $scope.timerOutput,
              );
              $scope.timerState = timerStateUpdate(
                $scope.sensor.resources['5850'],
                $scope.timerState,
              );
            }

            $scope.timerMode = timerModeUpdate($scope.sensor.resources['5526'], $scope.timerMode);
          });
        },
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }

    node.on('close', function () {
      if (done) {
        done();
      }
    });
  }

  RED.nodes.registerType('ui_cron', Cron);

  const uipath = settings.ui ? settings.ui.path : 'ui';
  const fullPath = path.join('/', uipath, '/ui-cron/*').replace(/\\/g, '/');

  RED.httpNode.get(fullPath, function (req, res) {
    const options = {
      root: __dirname + '/lib/',
      dotfiles: 'deny',
    };
    res.sendFile(req.params[0], options);
  });
};
