module.exports = (configAsJson) => String.raw`
<link href='ui-cron/css/cron.css' rel='stylesheet' type='text/css'/>
<div ng-init='init(${configAsJson})'></div>
<svg
  ng-attr-height='{{updatedHeight()}}'
  ng-attr-width='{{updatedWidth()}}'
  ng-attr-viewBox='{{viewBox()}}'
  class="sensor-timer"
  ng-show="isMounted"
>
<g
  class="timer-modes"
  ng-attr-transform="translate({{updatedWidth() / 6}},{{updatedHeight() / 3.5}})"
>
  <text
    id="timer-mode-0-{{$id}}"
    y="0"
    ng-attr-x="{{updatedWidth() / 6}}"
    ng-click="setTimerMode(0)"
    ng-style='timerModeStyle()'
  >
    0
  </text>
  <text
    id="timer-mode-1-{{$id}}"
    y="0"
    ng-attr-x="{{updatedWidth() / 3.2}}"
    ng-click="setTimerMode(1)"
    ng-style='timerModeStyle()'
  >
    1
  </text>
  <text
    id="timer-mode-2-{{$id}}"
    y="0"
    ng-attr-x="{{updatedWidth() / 2.4}}"
    ng-click="setTimerMode(2)"
    ng-style='timerModeStyle()'
  >
    2
  </text>
</g>

<g
  class="setters"
  ng-attr-transform="translate({{updatedWidth() / 3.6}}, {{updatedHeight() / 3.4}})"
>
  <g class="minutes-set">
    <text
      id="timer-setter-0-{{$id}}"
      ng-attr-x="{{updatedWidth() / 80}}"
      ng-attr-y="{{updatedHeight() / 6}}"
      data-setter="minutes-plus"
      ng-click="setTimer(1 * 60)"
      ng-style='{{timerSetterStyle()}}'
    >
      +
    </text>
    <text
      id="timer-setter-1-{{$id}}"
      ng-attr-x="{{updatedWidth() / 7.5}}"
      ng-attr-y="{{updatedHeight() / 6}}"
      data-setter="minutes-minus"
      ng-click="setTimer(-1 * 60)"
      ng-style='{{timerSetterStyle()}}'
    >
      -
    </text>
  </g>
  <g class="seconds-set">
    <text
      id="timer-setter-2-{{$id}}"
      ng-attr-x="{{updatedWidth() / 3.8}}"
      ng-attr-y="{{updatedHeight() / 6}}"
      data-setter="seconds-plus"
      ng-click="setTimer(1)"
      ng-style='{{timerSetterStyle()}}'
    >
      +
    </text>
    <text
      id="timer-setter-3-{{$id}}"
      ng-attr-x="{{updatedWidth() / 2.65}}"
      ng-attr-y="{{updatedHeight() / 6}}"
      data-setter="seconds-minus"
      ng-click="setTimer(-1)"
      ng-style='{{timerSetterStyle()}}'
    >
      -
    </text>
  </g>
</g>

<g
  ng-attr-transform="translate({{updatedWidth() / 2}},{{updatedHeight() / 1.8}})"
  class="cron-group"
>
  <circle 
    ng-attr-r="{{updatedWidth() / 2.3}}" 
    class="cron-base" 
    ng-attr-style="stroke-width: {{updatedWidth() / 70}}px;"/>
  <g transform="rotate(-90)">
    <circle
      id="cron-progress-{{$id}}"
      ng-attr-r="{{updatedWidth() / 2.3}}"
      class="cron-progress"
      ng-attr-style="stroke: {{styles.primaryColor}}; stroke-width: {{updatedWidth() / 70}})px;"/>
    <g id="cron-pointer-{{$id}}" class="cron-pointer" >
      <circle
        id="cron-dot-{{$id}}"
        ng-attr-cx="{{updatedWidth() / 2.3}}"
        cy="0"
        ng-attr-r="{{updatedWidth() / 40}}"
        class="cron-dot"
        ng-attr-style="stroke: {{styles.primaryColor}}; stroke-width: {{updatedWidth() / 150}}px;"
      />
    </g>
  </g>
</g>

<g
  class="controls"
  ng-attr-transform="translate({{updatedWidth() / 2}}, {{updatedHeight() / 1.6}})"
>
  <text
    id="display-remain-time-{{$id}}"
    text-anchor="middle"
    y="0"
    class="display-remain-time"
    ng-attr-style="font-size: {{updatedWidth() / 5}}px; fill: {{styles.primaryColor}};"
    ng-click="editTimerField()"
  >
    <!-- {{ setTimeString(wholeTime) }} -->
  </text>
  <g ng-attr-transform="translate(0,{{updatedHeight() / 15}})" text-anchor="middle">
    <text
      id="pause-{{$id}}"
      ng-attr-x="{{-(updatedWidth() / 15)}}"
      ng-attr-y="{{updatedHeight() / 9}}"
      class="play"
      ng-style="{{triggerButtonStyle()}}"
      ng-click="pauseTimer()"
    >
      {{ playButton() }}
    </text>
    <text
      id="break-{{$id}}"
      ng-attr-x="{{updatedWidth() / 15}}"
      ng-attr-y="{{updatedHeight() / 9}}"
      class="stop"
      ng-style="{{triggerButtonStyle()}}"
      ng-click="stopTimer()"
    >
      ■
    </text>
  </g>
</g>

</svg>
`;
