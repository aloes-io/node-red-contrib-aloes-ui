module.exports = function (RED) {
  const settings = RED.settings;

  function HTML(config) {
    config.adminRoot = settings.httpAdminRoot;
    config.httpNodeRoot = settings.httpNodeRoot;
    const configAsJson = JSON.stringify(config);

    const html = String.raw`
    <svg 
      viewBox="0 0 320 40" 
      id="device-status-{{$id}}" 
      ng-init='init(${configAsJson})'>
      <circle 
        id="{{'device-status-icon-'+$id}}" 
        x="0" 
        y="0" 
        cx="0" 
        cy="20" 
        r="15" 
        fill="{{getStatusColor()}}" >
      </circle>
      <text
        id="device-name-{{$id}}" 
        x="35"
        y="25" 
        style="{{'font-weight:700'}}" 
      >
        {{getDeviceName()}}
      </text>
      <image
        id="device-icon-{{$id}}" 
        x="230"
        y="2"
        width="35px" 
        height="35px"
        preserveAspectRatio="xMidYMin slice"
        xlink:href="{{getDeviceIcon()}}">
      </image>
      <image
        id="device-selector-{{$id}}" 
        x="270"
        y="2"
        width="50px" 
        height="35px"
        preserveAspectRatio="xMidYMin slice"
        ng-click="selectDevice()"
        style="{{'cursor:pointer'}}" 
        xlink:href="{{getSelectorIcon()}}">
      </image>
    </svg>`;
    return html;
  }

  function checkConfig(node, conf) {
    if (!conf || !conf.hasOwnProperty('group')) {
      node.error(RED._('ui_device-status.error.no-group'));
      return false;
    }
    return true;
  }

  let ui = undefined;
  let done;

  function DeviceStatus(config) {
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

          $scope.init = function (config) {
            $scope.config = config;
            $scope.device = {};
            $scope.deviceName = config.deviceName;
            $scope.defaultDeviceIcon = 'https://aloes.io/icons/aloes/node.png';
            $scope.offLineColor = config.offLineColor;
            $scope.onLineColor = config.onLineColor;
            $scope.offLineText = config.offLineText;
            $scope.onLineText = config.onLineText;
            $scope.isSelected = false;
          };

          $scope.getDeviceIcon = () => {
            if ($scope.device && $scope.device.icons && $scope.device.icons.length) {
              return `https://aloes.io${$scope.device.icons[0]}`;
            }
            return $scope.defaultDeviceIcon;
          };

          $scope.getDeviceName = () => {
            return $scope.device && $scope.device.name ? $scope.device.name : $scope.deviceName;
          };

          $scope.getStatusColor = () => {
            return $scope.device && $scope.device.status ? $scope.onLineColor : $scope.offLineColor;
          };

          $scope.getSelectorIcon = () => {
            const baseUrl = `${$scope.config.adminRoot}/icons/node-red-contrib-aloes-ui/`;
            return `${baseUrl}${$scope.isSelected ? 'switch-on.svg' : 'switch-off.svg'}`;
          };

          $scope.selectDevice = () => {
            $scope.isSelected = !$scope.isSelected;
            $scope.send({ payload: $scope.device, isSelected: $scope.isSelected });
          };

          const compareNames = (source) => {
            if (source && source !== null) {
              return source === $scope.deviceName.toLowerCase();
            }
            return false;
          };

          $scope.$watch('msg', function (msg) {
            if (!msg || !msg.payload || !msg.payload.id) {
              return;
            }
            $scope.device = msg.payload;
            $scope.deviceName = msg.payload.name;

            if (msg.devicesSelection) {
              const index = msg.devicesSelection.findIndex(compareNames);
              $scope.isSelected = index > -1;
            }
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

  RED.nodes.registerType('ui_device-status', DeviceStatus);
};
