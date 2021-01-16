'use strict';

var vue = require('vue');

const CONFIG = {
  HOUR_TOKENS: ['HH', 'H', 'hh', 'h', 'kk', 'k'],
  MINUTE_TOKENS: ['mm', 'm'],
  SECOND_TOKENS: ['ss', 's'],
  APM_TOKENS: ['A', 'a'],
  BASIC_TYPES: ['hour', 'minute', 'second', 'apm']
};

const DEFAULT_OPTIONS = {
  format: 'HH:mm',
  minuteInterval: 1,
  secondInterval: 1,
  hourRange: null,
  minuteRange: null,
  secondRange: null,
  hideDisabledHours: false,
  hideDisabledMinutes: false,
  hideDisabledSeconds: false,
  hideDisabledItems: false,
  advancedKeyboard: false,
  hideDropdown: false,
  blurDelay: 300,
  manualInputTimeout: 1000,
  dropOffsetHeight: 160
};

var script = {
  name: 'VueTimepicker',

  props: {
    modelValue: { type: [ Object, String ] },
    format: { type: String },
    minuteInterval: { type: [ Number, String ] },
    secondInterval: { type: [ Number, String ] },

    hourRange: { type: Array },
    minuteRange: { type: Array },
    secondRange: { type: Array },

    hideDisabledHours: { type: Boolean, default: false },
    hideDisabledMinutes: { type: Boolean, default: false },
    hideDisabledSeconds: { type: Boolean, default: false },
    hideDisabledItems: { type: Boolean, default: false },

    hideClearButton: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    closeOnComplete: { type: Boolean, default: false },

    id: { type: String },
    name: { type: String },
    inputClass: { type: [ String, Object, Array ] },
    placeholder: { type: String },
    tabindex: { type: [ Number, String ], default: 0 },
    inputWidth: { type: String },
    autocomplete: { type: String, default: 'off' },

    hourLabel: { type: String },
    minuteLabel: { type: String },
    secondLabel: { type: String },
    apmLabel: { type: String },
    amText: { type: String },
    pmText: { type: String },

    blurDelay: { type: [ Number, String ] },
    advancedKeyboard: { type: Boolean, default: false },

    lazy: { type: Boolean, default: false },
    autoScroll: { type: Boolean, default: false },

    dropDirection: { type: String, default: 'down' },
    dropOffsetHeight: { type: [ Number, String ] },
    containerId: { type: String },

    manualInput: { type: Boolean, default: false },
    manualInputTimeout: { type: [ Number, String ] },
    hideDropdown: { type: Boolean, default: false },
    fixedDropdownButton: { type: Boolean, default: false },

    debugMode: { type: Boolean, default: false }
  },

  data () {
    return {
      timeValue: {},

      hours: [],
      minutes: [],
      seconds: [],
      apms: [],

      isActive: false,
      showDropdown: false,
      isFocusing: false,
      debounceTimer: undefined,

      hourType: 'HH',
      minuteType: 'mm',
      secondType: '',
      apmType: '',
      hour: '',
      minute: '',
      second: '',
      apm: '',
      fullValues: undefined,
      bakDisplayTime: undefined,
      doClearApmChecking: false,

      selectionTimer: undefined,
      kbInputTimer: undefined,
      kbInputLog: '',
      bakCurrentPos: undefined,
      forceDropOnTop: false
    }
  },

  emits: ['update:modelValue', 'change', 'open', 'close', 'focus', 'blur', 'error'],

  computed: {
    opts () {
      const options = Object.assign({}, DEFAULT_OPTIONS);

      if (this.format && this.format.length) {
        options.format = String(this.format);
      }

      if (this.isNumber(this.minuteInterval)) {
        options.minuteInterval = +this.minuteInterval;
      }
      // minuteInterval failsafe
      if (!options.minuteInterval || options.minuteInterval < 1 || options.minuteInterval > 60) {
        if (this.debugMode) {
          if (options.minuteInterval > 60) {
            this.debugLog(`"minute-interval" should be less than 60. Current value is ${this.minuteInterval}`);
          } else if (options.minuteInterval === 0 || options.minuteInterval < 1) {
            this.debugLog(`"minute-interval" should be NO less than 1. Current value is ${this.minuteInterval}`);
          }
        }
        if (options.minuteInterval === 0) {
          options.minuteInterval = 60;
        } else {
          options.minuteInterval = 1;
        }
      }

      if (this.isNumber(this.secondInterval)) {
        options.secondInterval = +this.secondInterval;
      }
      // secondInterval failsafe
      if (!options.secondInterval || options.secondInterval < 1 || options.secondInterval > 60) {
        if (this.debugMode) {
          if (options.secondInterval > 60) {
            this.debugLog(`"second-interval" should be less than 60. Current value is ${this.secondInterval}`);
          } else if (options.secondInterval === 0 || options.secondInterval < 1) {
            this.debugLog(`"second-interval" should be NO less than 1. Current value is ${this.secondInterval}`);
          }
        }
        if (options.secondInterval === 0) {
          options.secondInterval = 60;
        } else {
          options.secondInterval = 1;
        }
      }

      if (this.hourRange && Array.isArray(this.hourRange)) {
        options.hourRange = JSON.parse(JSON.stringify(this.hourRange));
        if (!this.hourRange.length && this.debugMode) {
          this.debugLog('The "hour-range" array is empty (length === 0)');
        }
      }

      if (this.minuteRange && Array.isArray(this.minuteRange)) {
        options.minuteRange = JSON.parse(JSON.stringify(this.minuteRange));
        if (!this.minuteRange.length && this.debugMode) {
          this.debugLog('The "minute-range" array is empty (length === 0)');
        }
      }

      if (this.secondRange && Array.isArray(this.secondRange)) {
        options.secondRange = JSON.parse(JSON.stringify(this.secondRange));
        if (!this.secondRange.length && this.debugMode) {
          this.debugLog('The "second-range" array is empty (length === 0)');
        }
      }

      if (this.hideDisabledItems) {
        options.hideDisabledItems = true;
      }

      if (this.hideDisabledHours || this.hideDisabledItems) {
        options.hideDisabledHours = true;
      }
      if (this.hideDisabledMinutes || this.hideDisabledItems) {
        options.hideDisabledMinutes = true;
      }
      if (this.hideDisabledSeconds || this.hideDisabledItems) {
        options.hideDisabledSeconds = true;
      }

      if (this.hideDropdown) {
        if (this.manualInput) {
          options.hideDropdown = true;
        } else if (this.debugMode) {
          this.debugLog('"hide-dropdown" only works with "manual-input" mode');
        }
      }

      if (this.blurDelay && +this.blurDelay > 0) {
        options.blurDelay = +this.blurDelay;
      }

      if (this.manualInputTimeout && +this.manualInputTimeout > 0) {
        options.manualInputTimeout = +this.manualInputTimeout;
      }

      if (this.dropOffsetHeight && +this.dropOffsetHeight > 0) {
        options.dropOffsetHeight = +this.dropOffsetHeight;
      }

      return options
    },

    useStringValue () {
      return typeof this.modelValue === 'string'
    },

    formatString () {
      return this.opts.format || DEFAULT_OPTIONS.format
    },

    inUse () {
      const typesInUse = CONFIG.BASIC_TYPES.filter(type => this.getTokenByType(type));
      // Sort types and tokens by their sequence in the "format" string
      typesInUse.sort((l, r) => {
        return this.formatString.indexOf(this.getTokenByType(l) || null) - this.formatString.indexOf(this.getTokenByType(r) || null)
      });
      const tokensInUse = typesInUse.map(type => this.getTokenByType(type));
      return {
        hour: !!this.hourType,
        minute: !!this.minuteType,
        second: !!this.secondType,
        apm: !!this.apmType,
        types: typesInUse || [],
        tokens: tokensInUse || []
      }
    },

    displayTime () {
      let formatString = String(this.formatString);
      if (this.hour) {
        formatString = formatString.replace(new RegExp(this.hourType, 'g'), this.hour);
      }
      if (this.minute) {
        formatString = formatString.replace(new RegExp(this.minuteType, 'g'), this.minute);
      }
      if (this.second && this.secondType) {
        formatString = formatString.replace(new RegExp(this.secondType, 'g'), this.second);
      }
      if (this.apm && this.apmType) {
        formatString = formatString.replace(new RegExp(this.apmType, 'g'), this.apm);
      }
      return formatString
    },

    customDisplayTime () {
      if (!this.amText && !this.pmText) {
        return this.displayTime
      }
      return this.displayTime.replace(new RegExp(this.apm, 'g'), this.apmDisplayText(this.apm))
    },

    inputIsEmpty () {
      return this.formatString === this.displayTime
    },

    allValueSelected () {
      if (
        (this.inUse.hour && !this.hour) ||
        (this.inUse.minute && !this.minute) ||
        (this.inUse.second && !this.second) ||
        (this.inUse.apm && !this.apm)
      ) {
        return false
      }
      return true
    },

    columnsSequence () {
      return this.inUse.types.map(type => type) || []
    },

    showClearBtn () {
      if (this.hideClearButton || this.disabled) {
        return false
      }
      return !this.inputIsEmpty
    },

    showDropdownBtn () {
      if (this.fixedDropdownButton) { return true }
      if (this.opts.hideDropdown && this.isActive && !this.showDropdown) {
        return true
      }
      return false
    },

    baseOn12Hours () {
      return this.hourType === 'h' || this.hourType === 'hh'
    },

    hourRangeIn24HrFormat () {
      if (!this.hourType || !this.opts.hourRange) { return false }
      if (!this.opts.hourRange.length) { return [] }

      const range = [];
      this.opts.hourRange.forEach(value => {
        if (value instanceof Array) {
          if (value.length > 2 && this.debugMode) {
            this.debugLog(`Nested array within "hour-range" must contain no more than two items. Only the first two items of ${JSON.stringify(value)} will be taken into account.`);
          }

          let start = value[0];
          let end = value[1] || value[0];

          if (this.is12hRange(start)) {
            start = this.translate12hRange(start);
          }
          if (this.is12hRange(end)) {
            end = this.translate12hRange(end);
          }

          for (let i = +start; i <= +end; i++) {
            if (i < 0 || i > 24) { continue }
            if (!range.includes(i)) {
              range.push(i);
            }
          }
        } else {
          if (this.is12hRange(value)) {
            value = this.translate12hRange(value);
          } else {
            value = +value;
          }
          if (value < 0 || value > 24) { return }
          if (!range.includes(value)) {
            range.push(value);
          }
        }
      });
      range.sort((l, r) => { return l - r });
      return range
    },

    restrictedHourRange () {
      // No restriction
      if (!this.hourRangeIn24HrFormat) { return false }
      // 12-Hour
      if (this.baseOn12Hours) {
        const range = this.hourRangeIn24HrFormat.map((value) => {
          if (value === 12) {
            return '12p'
          } else if (value === 24 || value === 0) {
            return '12a'
          }
          return value > 12 ? `${value % 12}p` : `${value}a`
        });
        return range
      }
      // 24-Hour
      return this.hourRangeIn24HrFormat
    },

    validHoursList () {
      if (!this.manualInput) { return false }
      if (this.restrictedHourRange) {
        let list = [];
        if (this.baseOn12Hours) {
          list = this.restrictedHourRange.map(hr => {
            const l = hr.substr(0, hr.length - 1);
            const r = hr.substr(-1);
            return `${this.formatValue(this.hourType, l)}${r}`
          });
          const am12Index = list.indexOf('12a');
          if (am12Index > 0) {
            // Make '12a' the first item in h/hh
            list.unshift(list.splice(am12Index, 1)[0]);
          }
          return list
        }
        list = this.restrictedHourRange.map(hr => {
          return this.formatValue(this.hourType, hr)
        });
        if (list.length > 1 && list[0] && list[0] === '24') {
          // Make '24' the last item in k/kk
          list.push(list.shift());
        }
        return list
      }
      if (this.baseOn12Hours) {
        return [].concat([], this.hours.map(hr => `${hr}a`), this.hours.map(hr => `${hr}p`))
      }
      return this.hours
    },

    has () {
      const result = {
        customApmText: false
      };
      const apmEnabled = !!this.apmType;

      if (apmEnabled && this.hourRangeIn24HrFormat && this.hourRangeIn24HrFormat.length) {
        const range = [].concat([], this.hourRangeIn24HrFormat);
        result.am = range.some(value => value < 12 || value === 24);
        result.pm = range.some(value => value >= 12 && value < 24);
      } else {
        result.am = apmEnabled;
        result.pm = apmEnabled;
      }
      if ((this.amText && this.amText.length) || (this.pmText && this.pmText.length)) {
        result.customApmText = true;
      }
      return result
    },

    minuteRangeList () {
      if (!this.minuteType || !this.opts.minuteRange) { return false }
      if (!this.opts.minuteRange.length) { return [] }
      return this.renderRangeList(this.opts.minuteRange, 'minute')
    },

    secondRangeList () {
      if (!this.secondType || !this.opts.secondRange) { return false }
      if (!this.opts.secondRange.length) { return [] }
      return this.renderRangeList(this.opts.secondRange, 'second')
    },
    
    hourLabelText () {
      return this.hourLabel || this.hourType
    },
    minuteLabelText () {
      return this.minuteLabel || this.minuteType
    },
    secondLabelText() {
      return this.secondLabel || this.secondType
    },
    apmLabelText () {
      return this.apmLabel || this.apmType
    },

    inputWidthStyle () {
      if (!this.inputWidth || !this.inputWidth.length) { return }
      return {
        width: this.inputWidth
      }
    },

    tokenRegexBase () {
      return this.inUse.tokens.join('|')
    },

    tokenChunks () {
      if (!this.manualInput && !this.useStringValue) { return false }

      const formatString = String(this.formatString);
      const tokensRegxStr = `(${this.tokenRegexBase})+?`;
      const tokensMatchAll = this.getMatchAllByRegex(formatString, tokensRegxStr);

      const tokenChunks = [];
      for (let tkMatch of tokensMatchAll) {
        const rawToken = tkMatch[0];
        const tokenMatchItem = {
          index: tkMatch.index,
          token: rawToken,
          type: this.getTokenType(rawToken),
          needsCalibrate: rawToken.length < 2,
          len: (rawToken || '').length
        };
        tokenChunks.push(tokenMatchItem);
      }
      return tokenChunks
    },

    needsPosCalibrate () {
      if (!this.manualInput) { return false }
      return this.tokenChunks.some(chk => chk.needsCalibrate)
    },

    tokenChunksPos () {
      if (!this.manualInput) { return false }
      if (!this.needsPosCalibrate) {
        return this.tokenChunks.map(chk => {
          return {
            token: chk.token,
            type: chk.type,
            start: chk.index,
            end: chk.index + chk.len
          }
        })
      }
      const list = [];
      let calibrateLen = 0;
      this.tokenChunks.forEach(chk => {
        let chunkCurrentLen;
        // Adjust for customized AM/PM text
        if (chk.type === 'apm' && this.has.customApmText) {
          if (this.apm && this.apm.length) {
            const customApmText = this.apm.toLowerCase() === 'am' ? this.amText : this.pmText;
            chunkCurrentLen = (customApmText && customApmText.length) ? customApmText.length : chk.len;
          } else {
            chunkCurrentLen = chk.len;
          }
        // Others
        } else {
          chunkCurrentLen = this[chk.type] && this[chk.type].length ? this[chk.type].length : chk.len;
        }
        list.push({
          token: chk.token,
          type: chk.type,
          start: chk.index + calibrateLen,
          end: chk.index + calibrateLen + chunkCurrentLen
        });
        if (chk.needsCalibrate && chunkCurrentLen > chk.len) {
          calibrateLen += (chunkCurrentLen - chk.len);
        }
      });
      return list
    },

    invalidValues () {
      if (this.inputIsEmpty) { return [] }
      if (!this.restrictedHourRange && !this.minuteRangeList && !this.secondRangeList && this.opts.minuteInterval === 1 && this.opts.secondInterval === 1) { return [] }

      const result = [];
      if (this.inUse.hour && !this.isEmptyValue(this.hourType, this.hour) && (!this.isValidValue(this.hourType, this.hour) || this.isDisabled('hour', this.hour))) {
        result.push('hour');
      }
      if (this.inUse.minute && !this.isEmptyValue(this.minuteType, this.minute) && (!this.isValidValue(this.minuteType, this.minute) || this.isDisabled('minute', this.minute) || this.notInInterval('minute', this.minute))) {
        result.push('minute');
      }
      if (this.inUse.second && !this.isEmptyValue(this.secondType, this.second) && (!this.isValidValue(this.secondType, this.second) || this.isDisabled('second', this.second) || this.notInInterval('second', this.second))) {
        result.push('second');
      }
      if (this.inUse.apm && !this.isEmptyValue(this.apmType, this.apm) && (!this.isValidValue(this.apmType, this.apm) || this.isDisabled('apm', this.apm))) {
        result.push('apm');
      }
      if (result.length) {
        return result
      }
      return []
    },

    hasInvalidInput () {
      return Boolean(this.invalidValues && this.invalidValues.length)
    },

    autoDirectionEnabled () {
      return this.dropDirection === 'auto'
    },

    dropdownDirClass () {
      if (this.autoDirectionEnabled) {
        return this.forceDropOnTop ? 'drop-up' : 'drop-down'
      }
      return this.dropDirection === 'up' ? 'drop-up' : 'drop-down'      
    }
  },

  watch: {
    'opts.format' (newValue) {
      this.renderFormat(newValue);
    },
    'opts.minuteInterval' (newInteval) {
      this.renderList('minute', newInteval);
    },
    'opts.secondInterval' (newInteval) {
      this.renderList('second', newInteval);
    },
    value: {
      deep: true,
      handler () {
        this.readValues();
      }
    },
    displayTime () {
      this.fillValues();
    },
    disabled (toDisabled) {
      if (toDisabled) {
        // Force close dropdown and reset status when disabled
        if (this.isActive) {
          this.isActive = false;
        }
        if (this.showDropdown) {
          this.showDropdown = false;
        }
      }
    },
    'invalidValues.length' (newLength, oldLength) {
      if (newLength && newLength >= 1) {
        this.$emit('error', this.invalidValues);
      } else if (oldLength && oldLength >= 1) {
        this.$emit('error', []);
      }
    }
  },

  methods: {
    formatValue (token, i) {
      if (!this.isNumber(i)) { return '' }
      i = +i;
      switch (token) {
        case 'H':
        case 'h':
        case 'k':
        case 'm':
        case 's':
          if (['h', 'k'].includes(token) && i === 0) {
            return token === 'k' ? '24' : '12'
          }
          return String(i)
        case 'HH':
        case 'mm':
        case 'ss':
        case 'hh':
        case 'kk':
          if (['hh', 'kk'].includes(token) && i === 0) {
            return token === 'kk' ? '24' : '12'
          }
          return i < 10 ? `0${i}` : String(i)
        default:
          return ''
      }
    },

    checkAcceptingType (validValues, formatString) {
      if (!validValues || !formatString || !formatString.length) { return '' }
      for (let i = 0; i < validValues.length; i++) {
        if (formatString.indexOf(validValues[i]) > -1) {
          return validValues[i]
        }
      }
      return ''
    },

    renderFormat (newFormat) {
      newFormat = newFormat || this.opts.format || DEFAULT_OPTIONS.format;

      let hourType = this.checkAcceptingType(CONFIG.HOUR_TOKENS, newFormat);
      let minuteType = this.checkAcceptingType(CONFIG.MINUTE_TOKENS, newFormat);
      this.secondType = this.checkAcceptingType(CONFIG.SECOND_TOKENS, newFormat);
      this.apmType = this.checkAcceptingType(CONFIG.APM_TOKENS, newFormat);

      // Failsafe checking
      if (!hourType && !minuteType && !this.secondType && !this.apmType) {
        if (this.debugMode && this.format) {
          this.debugLog(`No valid tokens found in your defined "format" string "${this.format}". Fallback to the default "HH:mm" format.`);
        }
        hourType = 'HH';
        minuteType = 'mm';
      }
      this.hourType = hourType;
      this.minuteType = minuteType;

      this.hourType ? this.renderHoursList() : this.hours = [];
      this.minuteType ? this.renderList('minute') : this.minutes = [];
      this.secondType ? this.renderList('second') : this.seconds = [];
      this.apmType ? this.renderApmList() : this.apms = [];

      vue.nextTick(() => {
        this.readValues();
      });
    },

    renderHoursList () {
      const hoursCount = this.baseOn12Hours ? 12 : 24;
      const hours = [];
      for (let i = 0; i < hoursCount; i++) {
        if (this.hourType === 'k' || this.hourType === 'kk') {
          hours.push(this.formatValue(this.hourType, i + 1));
        } else {
          hours.push(this.formatValue(this.hourType, i));
        }
      }
      this.hours = hours;
    },

    renderList (listType, interval) {
      if (!this.isMinuteOrSecond(listType)) { return }

      const isMinute = listType === 'minute';
      interval = interval || (isMinute ? (this.opts.minuteInterval || DEFAULT_OPTIONS.minuteInterval) : (this.opts.secondInterval || DEFAULT_OPTIONS.secondInterval));

      const result = [];
      for (let i = 0; i < 60; i += interval) {
        result.push(this.formatValue(isMinute ? this.minuteType : this.secondType, i));
      }
      isMinute ? this.minutes = result : this.seconds = result;
    },

    renderApmList () {
      this.apms = this.apmType === 'A' ? ['AM', 'PM'] : ['am', 'pm'];
    },

    readValues () {
      if (this.useStringValue) {
        if (this.debugMode) {
          this.debugLog(`Received a string value: "${this.modelValue}"`);
        }
        this.readStringValues(this.modelValue);
      } else {
        if (this.debugMode) {
          this.debugLog(`Received an object value: "${JSON.stringify(this.modelValue || {})}"`);
        }
        this.readObjectValues(this.modelValue);
      }
    },

    readObjectValues (objValue) {
      const timeValue = JSON.parse(JSON.stringify(objValue || {}));
      const values = Object.keys(timeValue);

      // Failsafe for empty `v-model` object
      if (values.length === 0) {
        this.addFallbackValues();
        return
      }

      CONFIG.BASIC_TYPES.forEach(type => {
        const token = this.getTokenByType(type);
        if (values.indexOf(token) > -1) {
          const sanitizedValue = this.sanitizedValue(token, timeValue[token]);
          this[type] = sanitizedValue;
          timeValue[token] = sanitizedValue;
        } else {
          this[type] = '';
        }
      });
      this.timeValue = timeValue;
    },

    getMatchAllByRegex (testString, regexString) {
      const str = 'polyfillTest';
      const needsPolyfill = Boolean(!str.matchAll || typeof str.matchAll !== 'function');
      return needsPolyfill ? this.polyfillMatchAll(testString, regexString) : testString.matchAll(new RegExp(regexString, 'g'))
    },

    readStringValues (stringValue) {
      // Failsafe for empty `v-model` string
      if (!stringValue || !stringValue.length) {
        this.addFallbackValues();
        return
      }

      const formatString = String(this.formatString);
      const tokensRegxStr = `(${this.tokenRegexBase})+?`;
      const othersRegxStr = `[^(${this.tokenRegexBase})]+`;

      const tokensMatchAll = this.getMatchAllByRegex(formatString, tokensRegxStr);
      const othersMatchAll = this.getMatchAllByRegex(formatString, othersRegxStr);

      const chunks = [];
      const tokenChunks = [];

      for (let tkMatch of tokensMatchAll) {
        const tokenMatchItem = {
          index: tkMatch.index,
          token: tkMatch[0],
          isValueToken: true
        };
        chunks.push(tokenMatchItem);
        tokenChunks.push(tokenMatchItem);
      }

      for (let otMatch of othersMatchAll) {
        chunks.push({
          index: otMatch.index,
          token: otMatch[0]
        });
      }

      chunks.sort((l, r) => l.index < r.index ? -1 : 1);

      let regexCombo = '';
      chunks.forEach(chunk => {
        if (chunk.isValueToken) {
          const tokenRegex = this.getTokenRegex(chunk.token) || '';
          regexCombo += tokenRegex;
        } else {
          const safeChars = chunk.token.replace(/\\{0}(\*|\?|\.|\+)/g, '\\$1');
          regexCombo += `(?:${safeChars})`;
        }
      });

      const comboReg = new RegExp(regexCombo);

      // Do test before match
      if (comboReg.test(stringValue)) {
        const matchResults = stringValue.match(new RegExp(regexCombo));
        const valueResults = matchResults.slice(1, tokenChunks.length + 1);
        const timeValue = {};
        valueResults.forEach((value, vrIndex) => {
          if (tokenChunks[vrIndex]) {
            const targetToken = tokenChunks[vrIndex].token;
            timeValue[targetToken] = this.setValueFromString(value, targetToken);
          }
        });
        this.timeValue = timeValue;

        if (this.debugMode) {
          const tokenChunksForLog = tokenChunks.map(tChunk => tChunk && tChunk.token);
          this.debugLog(`Successfully parsed values ${JSON.stringify(valueResults)}\nfor ${JSON.stringify(tokenChunksForLog)}\nin format pattern '${this.formatString}'`);
        }
      } else {
        if (this.debugMode) {
          this.debugLog(`The input string in "v-model" does NOT match the "format" pattern\nformat: ${this.formatString}\nv-model: ${stringValue}`);
        }
      }
    },

    polyfillMatchAll (targetString, regxStr) {
      const matchesList = targetString.match(new RegExp(regxStr, 'g'));
      const result = [];
      const indicesReg = [];
      if (matchesList && matchesList.length) {
        matchesList.forEach(matchedItem => {
          const existIndex = indicesReg.findIndex(idxItem => idxItem.str === matchedItem);
          let index;
          if (existIndex >= 0) {
            if (indicesReg[existIndex] && indicesReg[existIndex].regex) {
              index = indicesReg[existIndex].regex.exec(targetString).index;
            }
          } else {
            const itemIndicesRegex = new RegExp(matchedItem, 'g');
            index = itemIndicesRegex.exec(targetString).index;
            indicesReg.push({
              str: String(matchedItem),
              regex: itemIndicesRegex
            });
          }
          result.push({
            0: String(matchedItem),
            index: index
          });
        });
      }
      return result
    },

    addFallbackValues () {
      const timeValue = {};
      this.inUse.types.forEach(type => {
        timeValue[this.getTokenByType(type)] = '';
      });
      this.timeValue = timeValue;
    },

    setValueFromString (parsedValue, token) {
      if (!token || !parsedValue) { return '' }
      const tokenType = this.getTokenType(token);
      if (!tokenType || !tokenType.length) { return '' }
      const stdValue = (parsedValue !== this.getTokenByType(tokenType)) ? parsedValue : '';
      this[tokenType] = stdValue;
      return stdValue
    },

    fillValues (forceEmit) {
      const fullValues = {};

      const baseHour = this.hour;
      const baseHourType = this.hourType;

      let apmValue;

      // Hour type or hour value is NOT set in the "format" string
      if (!baseHourType || !this.isNumber(baseHour)) {
        CONFIG.HOUR_TOKENS.forEach(token => fullValues[token] = '');
        apmValue = this.lowerCasedApm(this.apm || '');
        fullValues.a = apmValue;
        fullValues.A = apmValue.toUpperCase();

      // Both Hour type and value are set
      } else {
        const hourValue = +baseHour;
        const apmValue = (this.baseOn12Hours && this.apm) ? this.lowerCasedApm(this.apm) : false;

        CONFIG.HOUR_TOKENS.forEach((token) => {
          if (token === baseHourType) {
            fullValues[token] = baseHour;
            return
          }

          let value;
          let apm;
          switch (token) {
            case 'H':
            case 'HH':
            case 'k':
            case 'kk':
              if (this.baseOn12Hours) {
                if (apmValue === 'pm') {
                  value = hourValue < 12 ? hourValue + 12 : hourValue;
                } else if (['k', 'kk'].includes(token)) {
                  value = hourValue === 12 ? 24 : hourValue;
                } else {
                  value = hourValue % 12;
                }
              } else {
                if (['k', 'kk'].includes(token)) {
                  value = hourValue === 0 ? 24 : hourValue;
                } else {
                  value = hourValue % 24;
                }
              }
              fullValues[token] = this.formatValue(token, value);
              break
            case 'h':
            case 'hh':
              // h <-> hh
              if (this.baseOn12Hours) {
                value = hourValue;
                apm = apmValue || '';
              // Read from other hour formats
              } else {
                if (hourValue > 11 && hourValue < 24) {
                  apm = 'pm';
                  value = hourValue === 12 ? 12 : hourValue % 12;
                } else {
                  apm = 'am';
                  value = hourValue % 12 === 0 ? 12 : hourValue;
                }
              }
              fullValues[token] = this.formatValue(token, value);
              fullValues.a = apm;
              fullValues.A = apm.toUpperCase();
              break
          }
        });
      }

      fullValues.m = this.formatValue('m', this.minute);
      fullValues.mm = this.formatValue('mm', this.minute);
      fullValues.s = this.formatValue('s', this.second);
      fullValues.ss = this.formatValue('ss', this.second);

      this.fullValues = fullValues;

      // On lazy mode, emit `input` and `change` events only when:
      // - The user pick a new value and then close the dropdown
      // - The user click the ("x") clear button
      if (!this.lazy || forceEmit) {
        this.emitTimeValue();
      }

      if (this.closeOnComplete && this.allValueSelected && this.showDropdown) {
        this.toggleActive();
      }
    },

    emitTimeValue () {
      if (!this.fullValues) { return }

      if (this.lazy && this.bakDisplayTime === this.displayTime) {
        if (this.debugMode) {
          this.debugLog('The value does not change on `lazy` mode. Skip the emitting `input` and `change` event.');
        }
        return
      }

      const fullValues = JSON.parse(JSON.stringify(this.fullValues));

      if (this.useStringValue) {
        this.$emit('update:modelValue', this.inputIsEmpty ? '' : String(this.displayTime));
      } else {
        const tokensInUse = this.inUse.tokens || [];
        const timeValue = {};
        tokensInUse.forEach((token) => {
          timeValue[token] = fullValues[token] || '';
        });
        this.$emit('update:modelValue', JSON.parse(JSON.stringify(timeValue)));
      }

      this.$emit('change', {
        data: fullValues,
        displayTime: this.inputIsEmpty ? '' : String(this.displayTime)
      });
    },

    translate12hRange (value) {
      const valueT = this.match12hRange(value);
      if (+valueT[1] === 12) {
        return +valueT[1] + (valueT[2].toLowerCase() === 'p' ? 0 : 12)
      }
      return +valueT[1] + (valueT[2].toLowerCase() === 'p' ? 12 : 0)
    },

    isDisabled (type, value) {
      if (!this.isBasicType(type) || !this.inUse[type]) { return true }
      switch (type) {
        case 'hour':
          return this.isDisabledHour(value)
        case 'minute':
        case 'second':
          if (!this[`${type}RangeList`]) {
            return false
          }
          return !this[`${type}RangeList`].includes(value)
        case 'apm':
          if (!this.restrictedHourRange) {
            return false
          }
          return !this.has[this.lowerCasedApm(value)]
        default:
          return true
      }
    },

    isDisabledHour (value) {
      if (!this.restrictedHourRange) { return false }
      if (this.baseOn12Hours) {
        if (!this.apm || !this.apm.length) {
          return false
        } else {
          const token = this.apm.toLowerCase() === 'am' ? 'a' : 'p';
          return !this.restrictedHourRange.includes(`${+value}${token}`)
        }
      }
      // Fallback for 'HH' and 'H hour format with a `hour-range` in a 12-hour form
      if (
        (this.hourType === 'HH' || this.hourType === 'H') &&
        +value === 0 && this.restrictedHourRange.includes(24)
      ) {
        return false
      }
      return !this.restrictedHourRange.includes(+value)
    },

    notInInterval (section, value) {
      if (!section || !this.isMinuteOrSecond(section)) { return }
      if (this.opts[`${section}Interval`] === 1) { return false }
      return +value % this.opts[`${section}Interval`] !== 0
    },

    renderRangeList (rawRange, section) {
      if (!rawRange || !section || !this.isMinuteOrSecond(section)) { return [] }
      const range = [];
      let formatedValue;
      rawRange.forEach(value => {
        if (value instanceof Array) {
          if (value.length > 2 && this.debugMode) {
            this.debugLog(`Nested array within "${section}-range" must contain no more than two items. Only the first two items of ${JSON.stringify(value)} will be taken into account.`);
          }
          const start = value[0];
          const end = value[1] || value[0];
          for (let i = +start; i <= +end; i++) {
            if (i < 0 || i > 59) { continue }
            formatedValue = this.formatValue(this.getTokenByType(section), i);
            if (!range.includes(formatedValue)) {
              range.push(formatedValue);
            }
          }
        } else {
          if (+value < 0 || +value > 59) { return }
          formatedValue = this.formatValue(this.getTokenByType(section), value);
          if (!range.includes(formatedValue)) {
            range.push(formatedValue);
          }
        }
      });
      range.sort((l, r) => { return l - r });
      // Debug Mode
      if (this.debugMode) {
        const fullList = (section === 'minute' ? this.minutes : this.seconds) || [];
        const validItems = fullList.filter(item => range.includes(item));
        if (!validItems || !validItems.length) {
          if (section === 'minute') {
            this.debugLog(`The minute list is empty due to the "minute-range" config\nminute-range: ${JSON.stringify(this.minuteRange)}\nminute-interval: ${this.opts.minuteInterval}`);
          } else {
            this.debugLog(`The second list is empty due to the "second-range" config\nsecond-range: ${JSON.stringify(this.secondRange)}\nsecond-interval: ${this.opts.secondInterval}`);
          }
        }
      }
      return range
    },

    forceApmSelection () {
      if (this.manualInput) {
        // Skip this to allow users to paste a string value from the clipboard in Manual Input mode
        return
      }
      if (this.apmType && !this.apm) {
        if (this.has.am || this.has.pm) {
          this.doClearApmChecking = true;
          const apmValue = this.has.am ? 'am' : 'pm';
          this.apm = this.apmType === 'A' ? apmValue.toUpperCase() : apmValue;
        }
      }
    },

    emptyApmSelection () {
      if (this.doClearApmChecking && this.hour === '' && this.minute === '' && this.second === '') {
        this.apm = '';
      }
      this.doClearApmChecking = false;
    },

    apmDisplayText (apmValue) {
      if (this.amText && this.lowerCasedApm(apmValue) === 'am') {
        return this.amText
      }
      if (this.pmText && this.lowerCasedApm(apmValue) === 'pm') {
        return this.pmText
      }
      return apmValue
    },

    toggleActive () {
      if (this.disabled) { return }
      this.isActive = !this.isActive;

      if (this.isActive) {
        this.isFocusing = true;
        if (this.manualInput) {
          this.$emit('focus');
        }
        if (!this.opts.hideDropdown) {
          this.setDropdownState(true);
        }
        // Record to check if value did change in the later phase
        if (this.lazy) {
          this.bakDisplayTime = String(this.displayTime || '');
        }
        if (this.manualInput && !this.inputIsEmpty) {
          vue.nextTick(() => {
            if (this.$refs.input && this.$refs.input.selectionStart === 0 && this.$refs.input.selectionEnd === this.displayTime.length) {
              // Select the first slot instead of the whole value string when tabbed in
              this.selectFirstSlot();
            }
          });
        }
      } else {
        if (this.showDropdown) {
          this.setDropdownState(false);
        } else if (this.manualInput) {
          this.$emit('blur');
        }
        this.isFocusing = false;
        if (this.lazy) {
          this.fillValues(true);
          this.bakDisplayTime = undefined;
        }
      }

      if (this.restrictedHourRange && this.baseOn12Hours) {
        this.showDropdown ? this.forceApmSelection() : this.emptyApmSelection();
      }
      if (this.showDropdown) {
        this.checkForAutoScroll();
      }
    },

    setDropdownState (toShow, fromUserClick = false) {
      if (toShow) {
        this.keepFocusing();
        if (this.autoDirectionEnabled) {
          this.checkDropDirection();
        }
        this.showDropdown = true;
        this.$emit('open'); 
        if (fromUserClick) {
          if (this.fixedDropdownButton) {
            this.isActive = true;
          }
          this.$emit('blur');
          this.checkForAutoScroll();
        }
      } else {
        this.showDropdown = false;
        this.$emit('close');
      }
    },

    blurEvent () {
      if (this.manualInput && !this.opts.hideDropdown) {
        // hideDropdown's `blur` event is handled somewhere else
        this.$emit('blur');
      }
    },

    select (type, value) {
      if (this.isBasicType(type) && !this.isDisabled(type, value)) {
        this[type] = value;
        if (this.doClearApmChecking) {
          this.doClearApmChecking = false;
        }
      }
    },

    clearTime () {
      if (this.disabled) { return }
      this.hour = '';
      this.minute = '';
      this.second = '';
      this.apm = '';

      if (this.manualInput && this.$refs && this.$refs.input && this.$refs.input.value.length) {
        this.$refs.input.value = '';
      }

      if (this.lazy) {
        this.fillValues(true);
      }
    },

    //
    // Auto-Scroll
    //

    checkForAutoScroll () {
      if (this.inputIsEmpty) { return }
      if (this.autoScroll) {
        vue.nextTick(() => {
          this.scrollToSelectedValues();
        });
      } else if (this.advancedKeyboard) {
        // Auto-focus on selected value in the first column for advanced-keyboard
        vue.nextTick(() => {
          const firstColumn = this.inUse.types[0];
          this.scrollToSelected(firstColumn, true);
        });
      }
    },

    scrollToSelected (column, allowFallback = false) {
      if (!this.timeValue || this.inputIsEmpty) { return }
      const targetList = this.$el.querySelectorAll(`ul.${column}s`)[0];
      let targetValue = this.activeItemInCol(column)[0];
      if (!targetValue && allowFallback) {
        // No value selected in the target column, fallback to the first found valid item
        targetValue = this.validItemsInCol(column)[0];
      }
      if (targetList && targetValue) {
        targetList.scrollTop = targetValue.offsetTop || 0;
        if (this.advancedKeyboard) {
          targetValue.focus();
        }
      }
    },

    scrollToSelectedValues () {
      if (!this.timeValue || this.inputIsEmpty) { return }
      this.inUse.types.forEach(section => {
        this.scrollToSelected(section);
      });
    },

    //
    // Additional Keyboard Navigation
    //

    onFocus () {
      if (this.disabled) { return }
      if (!this.isFocusing) {
        this.isFocusing = true;
      }
      if (!this.isActive) {
        this.toggleActive();
      }
    },

    escBlur () {
      if (this.disabled) { return }
      window.clearTimeout(this.debounceTimer);
      this.isFocusing = false;
      const inputBox = this.$el.querySelectorAll('input.vue__time-picker-input')[0];
      if (inputBox) {
        inputBox.blur();
      }
    },

    debounceBlur () {
      if (this.disabled) { return }
      this.isFocusing = false;
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(() => {
        window.clearTimeout(this.debounceTimer);
        this.onBlur();
      }, this.opts.blurDelay);
    },

    onBlur () {
      if (!this.disabled && !this.isFocusing && this.isActive) {
        this.toggleActive();
      }
    },

    keepFocusing () {
      if (this.disabled) { return }
      window.clearTimeout(this.debounceTimer);
      if (!this.isFocusing) {
        this.isFocusing = true;
      }
    },

    validItemsInCol (column) {
      const columnClass = `${column}s`;
      return this.$el.querySelectorAll(`ul.${columnClass} > li:not(.hint):not([disabled])`)
    },

    activeItemInCol (column) {
      const columnClass = `${column}s`;
      return this.$el.querySelectorAll(`ul.${columnClass} > li.active:not(.hint)`)
    },

    getClosestSibling (column, dataKey, getPrevious = false) {
      const siblingsInCol = this.validItemsInCol(column);
      const selfIndex = Array.prototype.findIndex.call(siblingsInCol, (sbl) => {
        return sbl.getAttribute('data-key') === dataKey
      });

      // Already the first item
      if (getPrevious && selfIndex === 0) {
        return siblingsInCol[siblingsInCol.length - 1]
      }
      // Already the last item
      if (!getPrevious && selfIndex === siblingsInCol.length - 1) {
        return siblingsInCol[0]
      }
      // Selected value not in the valid values list
      if (selfIndex < 0) {
        return siblingsInCol[0]
      }

      if (getPrevious) {
        return siblingsInCol[selfIndex - 1]
      }
      return siblingsInCol[selfIndex + 1]
    },

    prevItem (column, dataKey, isManualInput = false) {
      const targetItem = this.getClosestSibling(column, dataKey, true);
      if (targetItem) {
        return isManualInput ? targetItem : targetItem.focus()
      }
    },

    nextItem (column, dataKey, isManualInput = false) {
      const targetItem = this.getClosestSibling(column, dataKey, false);
      if (targetItem) {
        return isManualInput ? targetItem : targetItem.focus()
      }
    },

    getSideColumnName (currentColumn, toLeft = false) {
      const currentColumnIndex = this.inUse.types.indexOf(currentColumn);
      if (toLeft && currentColumnIndex <= 0) {
        if (this.debugMode) {
          this.debugLog('You\'re in the leftmost list already');
        }
        return
      } else if (!toLeft && currentColumnIndex === (this.inUse.types.length - 1)) {
        if (this.debugMode) {
          this.debugLog('You\'re in the rightmost list already');
        }
        return
      }
      return this.inUse.types[toLeft ? currentColumnIndex - 1 : currentColumnIndex + 1]
    },

    getFirstItemInSideColumn (currentColumn, toLeft = false) {
      const targetColumn = this.getSideColumnName(currentColumn, toLeft);
      if (!targetColumn) { return }
      const listItems = this.validItemsInCol(targetColumn);
      if (listItems && listItems[0]) {
        return listItems[0]
      }
    },

    getActiveItemInSideColumn (currentColumn, toLeft = false) {
      const targetColumn = this.getSideColumnName(currentColumn, toLeft);
      if (!targetColumn) { return }
      const activeItems = this.activeItemInCol(targetColumn);
      if (activeItems && activeItems[0]) {
        return activeItems[0]
      }
    },

    toLeftColumn (currentColumn) {
      const targetItem = this.getActiveItemInSideColumn(currentColumn, true) || this.getFirstItemInSideColumn(currentColumn, true);
      if (targetItem) {
        targetItem.focus();
      }
    },

    toRightColumn (currentColumn) {
      const targetItem = this.getActiveItemInSideColumn(currentColumn, false) || this.getFirstItemInSideColumn(currentColumn, false);
      if (targetItem) {
        targetItem.focus();
      }
    },

    //
    // Manual Input
    //

    onMouseDown () {
      if (!this.manualInput) { return }
      window.clearTimeout(this.selectionTimer);
      this.selectionTimer = window.setTimeout(() => {
        window.clearTimeout(this.selectionTimer);
        if (this.$refs && this.$refs.input) {
          const nearestSlot = this.getNearestChunkByPos(this.$refs.input.selectionStart || 0);
          this.debounceSetInputSelection(nearestSlot);
        }
      }, 50);
    },

    keyDownHandler (evt) {
      if (evt.isComposing || evt.keyCode === 229) {
        // Skip IME inputs
        evt.preventDefault();
        evt.stopPropagation();
        return false
      }
      // Numbers
      if ((evt.keyCode >= 48 && evt.keyCode <= 57) || (evt.keyCode >= 96 && evt.keyCode <= 105)) {
        evt.preventDefault();
        this.keyboardInput(evt.key);
      // A|P|M
      } else if ([65, 80, 77].includes(evt.keyCode)) {
        evt.preventDefault();
        this.keyboardInput(evt.key, true);
      // Arrow keys
      } else if (evt.keyCode >= 37 && evt.keyCode <= 40) {
        evt.preventDefault();
        this.clearKbInputLog();
        this.arrowHandler(evt);
      // Delete|Backspace
      } else if (evt.keyCode === 8 || evt.keyCode === 46) {
        evt.preventDefault();
        this.clearKbInputLog();
        this.clearTime();
      // Tab
      } else if (evt.keyCode === 9) {
        this.clearKbInputLog();
        this.tabHandler(evt);
      // Prevent any Non-ESC and non-pasting inputs
      } else if (evt.keyCode !== 27 && !(evt.metaKey || evt.ctrlKey)) {
        evt.preventDefault();
      }
    },

    onCompostionStart (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.bakCurrentPos = this.getCurrentTokenChunk();
      return false
    },

    onCompostionEnd (evt) {
      evt.preventDefault();
      evt.stopPropagation();

      const cpsData = evt.data;
      let inputIsCustomApmText = false;
      if (this.has.customApmText) {
        inputIsCustomApmText = this.isCustomApmText(cpsData);
      }
      if (inputIsCustomApmText) {
        this.setSanitizedValueToSection('apm', inputIsCustomApmText);
      }

      this.$refs.input.value = this.has.customApmText ? this.customDisplayTime : this.displayTime;

      vue.nextTick(() => {
        if (this.bakCurrentPos) {
          const bakPos = JSON.parse(JSON.stringify(this.bakCurrentPos));
          if (inputIsCustomApmText) {
            bakPos.end = (bakPos.start + cpsData.length);
          }
          this.debounceSetInputSelection(bakPos);
          this.bakCurrentPos = null;
        }
      });
      return false
    },

    pasteHandler (evt) {
      evt.preventDefault();
      let pastingText = (evt.clipboardData || window.clipboardData).getData('text');
      if (this.debugMode) {
        this.debugLog(`Pasting value "${pastingText}" from clipboard`);
      }
      if (!pastingText || !pastingText.length) { return }

      // Replace custom AM/PM text (if any)
      if (this.has.customApmText) {
        pastingText = this.replaceCustomApmText(pastingText);
      }

      if (this.inputIsEmpty) {
        this.readStringValues(pastingText);
      } else {
        this.kbInputLog = pastingText.substr(-2, 2);
        this.setKbInput();
        this.debounceClearKbLog();
      }
    },

    arrowHandler (evt) {
      const direction = { 37: 'L', 38: 'U', 39: 'R', 40: 'D' }[evt.keyCode];
      if (direction === 'U' || direction === 'D') {
        if (this.inputIsEmpty) {
          this.selectFirstValidValue();
        } else {
          const currentChunk = this.getCurrentTokenChunk();
          if (!currentChunk) {
            this.selectFirstValidValue();
            return
          }
          const tokenType = currentChunk.type;
          this.getClosestValidItemInCol(tokenType, this[tokenType], direction);
          const newChunkPos = this.getCurrentTokenChunk();
          this.debounceSetInputSelection(newChunkPos);
        }
      } else if (direction === 'R') {
        this.toLateralToken(false);
      } else if (direction === 'L') {
        this.toLateralToken(true);
      }
    },

    tabHandler (evt) {      
      if (!this.inputIsEmpty && this.tokenChunksPos && this.tokenChunksPos.length) {
        const currentChunk = this.getCurrentTokenChunk();
        if (!currentChunk) { return }
        const firstChunk = this.tokenChunksPos[0];
        const lastChunk = this.tokenChunksPos[this.tokenChunksPos.length - 1];
        if ((evt.shiftKey && currentChunk.token !== firstChunk.token) || (!evt.shiftKey && currentChunk.token !== lastChunk.token)) {
          evt.preventDefault();
          this.toLateralToken(evt.shiftKey);
        }
      }
    },

    keyboardInput (newChar, isApm = false) {
      const currentChunk = this.getCurrentTokenChunk();
      if (!currentChunk || (currentChunk.type !== 'apm' && isApm) || (currentChunk.type === 'apm' && !isApm)) { return }
      this.kbInputLog = `${this.kbInputLog.substr(-1)}${newChar}`;
      this.setKbInput();
      this.debounceClearKbLog();
    },

    clearKbInputLog () {
      window.clearTimeout(this.kbInputTimer);
      this.kbInputLog = '';
    },

    debounceClearKbLog () {
      window.clearTimeout(this.kbInputTimer);
      this.kbInputTimer = window.setTimeout(() => {
        this.clearKbInputLog();
      }, this.opts.manualInputTimeout);
    },

    setKbInput (value) {
      value = value || this.kbInputLog;
      const currentChunk = this.getCurrentTokenChunk();
      if (!currentChunk || !value || !value.length) { return }
      const chunkType = currentChunk.type;
      const chunkToken = currentChunk.token;

      let validValue;
      if (chunkType === 'apm') {
        if (this.lowerCasedApm(value).includes('a')) {
          validValue = 'am';
        } else if (this.lowerCasedApm(value).includes('p')) {
          validValue = 'pm';
        }
        if (validValue) {
          validValue = chunkToken === 'A' ? validValue.toUpperCase() : validValue;
        }
      } else {
        if (this.isValidValue(chunkToken, value)) {
          validValue = value;
        } else {
          const lastInputValue = this.formatValue(chunkToken, value.substr(-1));
          if (this.isValidValue(chunkToken, lastInputValue)) {
            validValue = lastInputValue;
          }
        }
      }

      if (validValue) {
        this.setSanitizedValueToSection(chunkType, validValue);
        const newChunkPos = this.getCurrentTokenChunk();
        this.debounceSetInputSelection(newChunkPos);      
      }
      if (this.debugMode) {
        if (validValue) {
          this.debugLog(`Successfully set value "${validValue}" from latest input "${value}" for the "${chunkType}" slot`);
        } else {
          this.debugLog(`Value "${value}" is invalid in the "${chunkType}" slot`);
        }
      }
    },

    // Form Autofill
    onChange () {
      if (!this.manualInput || !this.$refs || !this.$refs.input) { return }
      const autoFillValue = this.$refs.input.value || '';
      if (autoFillValue && autoFillValue.length) {
        this.readStringValues(autoFillValue);
      }
    },

    getNearestChunkByPos (startPos) {
      if (!this.tokenChunksPos || !this.tokenChunksPos.length) { return }
      let nearest;
      let nearestDelta = -1;
      for (let i = 0; i < this.tokenChunksPos.length; i++) {
        const chunk = JSON.parse(JSON.stringify(this.tokenChunksPos[i]));
        if (chunk.start === startPos) {
          return chunk
        }
        const delta = Math.abs(chunk.start - startPos);
        if (nearestDelta < 0) {
          nearest = chunk;
          nearestDelta = delta;
        } else {
          if (nearestDelta <= delta) {
            return nearest
          }
          nearestDelta = delta;
          nearest = chunk;
        }
      }
      return nearest
    },

    selectFirstValidValue () {
      if (!this.tokenChunksPos || !this.tokenChunksPos.length) { return }
      const firstSlotType = this.tokenChunksPos[0].type;
      if (firstSlotType === 'hour') {
        this.getClosestHourItem();
      } else {
        this.getClosestValidItemInCol(firstSlotType, this[firstSlotType]);
      }
      this.selectFirstSlot();
    },

    getClosestHourItem (currentValue, direction = 'U') {
      if (!this.validHoursList || !this.validHoursList.length) {
        if (this.debugMode) {
          this.debugLog(`No valid hour values found, please check your "hour-range" config\nhour-range: ${JSON.stringify(this.hourRange)}`);
        }
        return
      }
      if (!currentValue) {
        this.setManualHour(this.validHoursList[0]);
        return
      }
      const currentIndex = this.validHoursList.findIndex(item => {
        if (!this.baseOn12Hours) {
          return item === currentValue
        } else {
          const valueKey = `${currentValue}${this.lowerCasedApm(this.apm) === 'pm' ? 'p' : 'a'}`; 
          return item === valueKey
        }
      });
      let nextIndex;
      if (currentIndex === -1) {
        nextIndex = 0;
      } else if (direction === 'D') {
        nextIndex = currentIndex === 0 ? this.validHoursList.length - 1 : currentIndex - 1;
      } else {
        nextIndex = (currentIndex + 1) % this.validHoursList.length;
      }
      const nextItem = this.validHoursList[nextIndex];
      this.setManualHour(nextItem);
    },

    getClosestValidItemInCol (column, currentValue, direction = 'U') {
      if (column === 'hour') {
        this.getClosestHourItem(currentValue, direction);
      } else {
        const nextItem = direction === 'D' ? this.prevItem(column, this[column], true) : this.nextItem(column, this[column], true);
        if (nextItem) {
          this.select(column, nextItem.getAttribute('data-key'));
        }
      }
    },

    setSanitizedValueToSection (section, inputValue) {
      if (!section || !this.getTokenByType(section)) { return }
      // NOTE: Disabled values are allowed here, followed by an 'error' event, though
      const sanitizedValue = this.sanitizedValue(this.getTokenByType(section), inputValue);
      this[section] = sanitizedValue;
    },

    setManualHour (nextItem) {
      if (this.is12hRange(nextItem)) {
        const hourT = this.match12hRange(nextItem);
        const apmValue = hourT[2] === 'a' ? 'AM' : 'PM';
        this.setSanitizedValueToSection('apm', this.apmType === 'a' ? apmValue.toLowerCase() : apmValue);
        this.setSanitizedValueToSection('hour', hourT[1]);
      } else {
        this.setSanitizedValueToSection('hour', nextItem);
      }
    },

    debounceSetInputSelection ({start = 0, end = 0 }) {
      vue.nextTick(() => {
        this.setInputSelectionRange(start, end);
      });
      window.clearTimeout(this.selectionTimer);
      this.selectionTimer = window.setTimeout(() => {
        window.clearTimeout(this.selectionTimer);
        // Double-check selection for 12hr format
        if (this.$refs.input && (this.$refs.input.selectionStart !== start || this.$refs.input.selectionEnd !== end)) {
          this.setInputSelectionRange(start, end);
        }
      }, 30);
    },

    setInputSelectionRange (start, end) {
      if (this.$refs && this.$refs.input) {
        this.$refs.input.setSelectionRange(start, end);
      }
    },

    getCurrentTokenChunk () {
      return this.getNearestChunkByPos((this.$refs.input && this.$refs.input.selectionStart) || 0)
    },

    selectFirstSlot () {
      const firstChunkPos = this.getNearestChunkByPos(0);
      this.debounceSetInputSelection(firstChunkPos);
    },

    toLateralToken (toLeft) {
      const currentChunk = this.getCurrentTokenChunk();
      if (!currentChunk) {
        this.selectFirstValidValue();
        return
      }
      const currentChunkIndex = this.tokenChunksPos.findIndex(chk => chk.token === currentChunk.token);
      if ((!toLeft && currentChunkIndex >= this.tokenChunksPos.length - 1) || (toLeft && currentChunkIndex === 0)) {
        if (this.debugMode) {
          if (toLeft) {
            this.debugLog('You\'re in the leftmost slot already');
          } else {
            this.debugLog('You\'re in the rightmost slot already');
          }
        }
        return
      }
      const targetSlotPos = toLeft ? this.tokenChunksPos[currentChunkIndex - 1] : this.tokenChunksPos[currentChunkIndex + 1];
      this.debounceSetInputSelection(targetSlotPos);
    },

    isCustomApmText (inputData) {
      if (!inputData || !inputData.length) { return false }
      if (this.amText && this.amText === inputData) {
        return this.apmType === 'A' ? 'AM' : 'am'
      }
      if (this.pmText && this.pmText === inputData) {
        return this.apmType === 'A' ? 'PM' : 'pm'
      }
      return false
    },

    replaceCustomApmText (inputString) {
      if (this.amText && this.amText.length && inputString.includes(this.amText)) {
        return inputString.replace(new RegExp(this.amText, 'g'), this.apmType === 'A' ? 'AM' : 'am')
      } else if (this.pmText && this.pmText.length && inputString.includes(this.pmText)) {
        return inputString.replace(new RegExp(this.pmText, 'g'), this.apmType === 'A' ? 'PM' : 'pm')
      }
      return inputString
    },

    checkDropDirection () {
      if (!this.$el) { return }
      let container;
      if (this.containerId && this.containerId.length) {
        container = document.getElementById(this.containerId);
        if (!container && this.debugMode) {
          this.debugLog(`Container with id "${this.containerId}" not found. Fallback to document body.`);
        }
      }
      const el = this.$el;
      let spaceDown;
      if (container && container.offsetHeight) {
        // Valid container found
        spaceDown = (container.offsetTop + container.offsetHeight) - (el.offsetTop + el.offsetHeight);
      } else {
        // Fallback to document body
        const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
        spaceDown = docHeight - (el.offsetTop + el.offsetHeight);
      }
      this.forceDropOnTop = this.opts.dropOffsetHeight > spaceDown;
    },

    //
    // Helpers
    //

    is12hRange (value) {
      return /^\d{1,2}(a|p|A|P)$/.test(value)
    },

    match12hRange (value) {
      return value.match(/^(\d{1,2})(a|p|A|P)$/)
    },

    isNumber (value) {
      return !isNaN(parseFloat(value)) && isFinite(value)
    },

    isBasicType (type) {
      return CONFIG.BASIC_TYPES.includes(type)
    },

    lowerCasedApm (apmValue) {
      return (apmValue || '').toLowerCase()
    },

    getTokenRegex (token) {
      switch (token) {
        case 'HH':
          return '([01][0-9]|2[0-3]|H{2})'
        case 'H':
          return '([0-9]{1}|1[0-9]|2[0-3]|H{1})'
        case 'hh':
          return '(0[1-9]|1[0-2]|h{2})'
        case 'h':
          return '([1-9]{1}|1[0-2]|h{1})'
        case 'kk':
          return '(0[1-9]|1[0-9]|2[0-4]|k{2})'
        case 'k':
          return '([1-9]{1}|1[0-9]|2[0-4]|k{1})'
        case 'mm':
          return '([0-5][0-9]|m{2})'
        case 'ss':
          return '([0-5][0-9]|s{2})'
        case 'm':
          return '([0-9]{1}|[1-5][0-9]|m{1})'
        case 's':
          return '([0-9]{1}|[1-5][0-9]|s{1})'
        case 'A':
          return '(AM|PM|A{1})'
        case 'a':
          return '(am|pm|a{1})'
        default:
          return ''
      }
    },

    isEmptyValue (targetToken, testValue) {
      return (!testValue || !testValue.length) || (testValue && testValue === targetToken)
    },

    isValidValue (targetToken, testValue) {
      if (!targetToken || this.isEmptyValue(targetToken, testValue)) { return false }
      const tokenRegexStr = this.getTokenRegex(targetToken);
      if (!tokenRegexStr || !tokenRegexStr.length) { return false }
      return (new RegExp(`^${tokenRegexStr}$`)).test(testValue)
    },

    sanitizedValue (targetToken, inputValue) {
      if (this.isValidValue(targetToken, inputValue)) {
        return inputValue
      }
      return ''
    },

    getTokenType (token) {
      return this.inUse.types[this.inUse.tokens.indexOf(token)] || ''
    },

    getTokenByType (type) {
      return this[`${type}Type`] || ''
    },

    isMinuteOrSecond (type) {
      return ['minute', 'second'].includes(type)
    },

    // Breaking attribution coercion changes in Vue 3
    // > https://v3.vuejs.org/guide/migration/attribute-coercion.html#overview
    booleanAttr (isTrue = false) {
      return isTrue ? true : null
    },

    debugLog (logText) {
      if (!logText || !logText.length) { return }
      let identifier = '';
      if (this.id) {
        identifier += `#${this.id}`;
      }
      if (this.name) {
        identifier += `[name=${this.name}]`;
      }
      if (this.inputClass) {
        let inputClasses = [];
        if (typeof this.inputClass === 'string') {
          inputClasses = this.inputClass.split(/\s/g);
        } else if (Array.isArray(this.inputClass)) {
          inputClasses = [].concat([], this.inputClass);
        } else if (typeof this.inputClass === 'object') {
          Object.keys(this.inputClass).forEach(clsName => {
            if (this.inputClass[clsName]) {
              inputClasses.push(clsName);
            }
          });
        }
        for (let inputClass of inputClasses) {
          if (inputClass && inputClass.trim().length) {
            identifier += `.${inputClass.trim()}`;
          }
        }
      }
      const finalLogText = `DEBUG: ${logText}${identifier ? `\n\t(${identifier})` : '' }`;
      if (window.console.debug && typeof window.console.debug === 'function') {
        window.console.debug(finalLogText);
      } else {
        window.console.log(finalLogText);
      }
    }
  },

  mounted () {
    window.clearTimeout(this.debounceTimer);
    window.clearTimeout(this.selectionTimer);
    window.clearTimeout(this.kbInputTimer);
    this.renderFormat();
  },

  beforeUnmount () {
    window.clearTimeout(this.debounceTimer);
    window.clearTimeout(this.selectionTimer);
    window.clearTimeout(this.kbInputTimer);
  }
};

const _hoisted_1 = {
  key: 0,
  class: "controls",
  tabindex: "-1"
};
const _hoisted_2 = /*#__PURE__*/vue.createVNode("span", { class: "char" }, "×", -1 /* HOISTED */);
const _hoisted_3 = /*#__PURE__*/vue.createVNode("span", { class: "char" }, "▾", -1 /* HOISTED */);
const _hoisted_4 = {
  key: 1,
  class: "custom-icon"
};

function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (vue.openBlock(), vue.createBlock("span", {
    class: "vue__time-picker",
    style: $options.inputWidthStyle
  }, [
    vue.createVNode("input", {
      type: "text",
      class: ["vue__time-picker-input", [$props.inputClass, {'is-empty': $options.inputIsEmpty, 'invalid': $options.hasInvalidInput, 'all-selected': $options.allValueSelected, 'disabled': $props.disabled, 'has-custom-icon': _ctx.$slots && _ctx.$slots.icon }]],
      ref: "input",
      style: $options.inputWidthStyle,
      id: $props.id,
      name: $props.name,
      value: $options.inputIsEmpty ? null : $options.customDisplayTime,
      placeholder: $props.placeholder ? $props.placeholder : $options.formatString,
      tabindex: $props.disabled ? -1 : $props.tabindex,
      disabled: $options.booleanAttr($props.disabled),
      readonly: $options.booleanAttr(!$props.manualInput),
      autocomplete: $props.autocomplete,
      onFocus: _cache[1] || (_cache[1] = (...args) => ($options.onFocus(...args))),
      onChange: _cache[2] || (_cache[2] = (...args) => ($options.onChange(...args))),
      onBlur: _cache[3] || (_cache[3] = $event => {$options.debounceBlur(); $options.blurEvent();}),
      onMousedown: _cache[4] || (_cache[4] = (...args) => ($options.onMouseDown(...args))),
      onKeydown: [
        _cache[5] || (_cache[5] = (...args) => ($options.keyDownHandler(...args))),
        _cache[9] || (_cache[9] = vue.withKeys(vue.withModifiers((...args) => ($options.escBlur(...args)), ["exact"]), ["esc"]))
      ],
      onCompositionstart: _cache[6] || (_cache[6] = (...args) => ($options.onCompostionStart(...args))),
      onCompositionend: _cache[7] || (_cache[7] = (...args) => ($options.onCompostionEnd(...args))),
      onPaste: _cache[8] || (_cache[8] = (...args) => ($options.pasteHandler(...args)))
    }, null, 46 /* CLASS, STYLE, PROPS, HYDRATE_EVENTS */, ["id", "name", "value", "placeholder", "tabindex", "disabled", "readonly", "autocomplete"]),
    ($options.showClearBtn || $options.showDropdownBtn)
      ? (vue.openBlock(), vue.createBlock("div", _hoisted_1, [
          (!$data.isActive && $options.showClearBtn)
            ? (vue.openBlock(), vue.createBlock("span", {
                key: 0,
                class: ["clear-btn", {'has-custom-btn': _ctx.$slots && _ctx.$slots.clearButton }],
                tabindex: "-1",
                onClick: _cache[10] || (_cache[10] = (...args) => ($options.clearTime(...args)))
              }, [
                vue.renderSlot(_ctx.$slots, "clearButton", {}, () => [
                  _hoisted_2
                ])
              ], 2 /* CLASS */))
            : vue.createCommentVNode("v-if", true),
          ($options.showDropdownBtn)
            ? (vue.openBlock(), vue.createBlock("span", {
                key: 1,
                class: ["dropdown-btn", {'has-custom-btn': _ctx.$slots && _ctx.$slots.dropdownButton }],
                tabindex: "-1",
                onClick: _cache[11] || (_cache[11] = $event => ($options.setDropdownState($props.fixedDropdownButton ? !$data.showDropdown : true, true))),
                onMousedown: _cache[12] || (_cache[12] = (...args) => ($options.keepFocusing(...args)))
              }, [
                vue.renderSlot(_ctx.$slots, "dropdownButton", {}, () => [
                  _hoisted_3
                ])
              ], 34 /* CLASS, HYDRATE_EVENTS */))
            : vue.createCommentVNode("v-if", true)
        ]))
      : vue.createCommentVNode("v-if", true),
    (_ctx.$slots && _ctx.$slots.icon)
      ? (vue.openBlock(), vue.createBlock("div", _hoisted_4, [
          vue.renderSlot(_ctx.$slots, "icon")
        ]))
      : vue.createCommentVNode("v-if", true),
    ($data.showDropdown)
      ? (vue.openBlock(), vue.createBlock("div", {
          key: 2,
          class: "time-picker-overlay",
          onClick: _cache[13] || (_cache[13] = (...args) => ($options.toggleActive(...args))),
          tabindex: "-1"
        }))
      : vue.createCommentVNode("v-if", true),
    vue.withDirectives(vue.createVNode("div", {
      class: ["dropdown", [$options.dropdownDirClass]],
      tabindex: "-1",
      style: $options.inputWidthStyle,
      onMouseup: _cache[42] || (_cache[42] = (...args) => ($options.keepFocusing(...args))),
      onClick: _cache[43] || (_cache[43] = vue.withModifiers(() => {}, ["stop"]))
    }, [
      vue.createVNode("div", {
        class: "select-list",
        style: $options.inputWidthStyle,
        tabindex: "-1"
      }, [
        vue.createCommentVNode(" Common Keyboard Support: less event listeners "),
        (!$props.advancedKeyboard)
          ? (vue.openBlock(true), vue.createBlock(vue.Fragment, { key: 0 }, vue.renderList($options.columnsSequence, (column) => {
              return (vue.openBlock(), vue.createBlock(vue.Fragment, { key: column }, [
                (column === 'hour')
                  ? (vue.openBlock(), vue.createBlock("ul", {
                      key: 0,
                      class: "hours",
                      onScroll: _cache[14] || (_cache[14] = (...args) => ($options.keepFocusing(...args)))
                    }, [
                      vue.createVNode("li", {
                        class: "hint",
                        textContent: vue.toDisplayString($options.hourLabelText)
                      }, null, 8 /* PROPS */, ["textContent"]),
                      (vue.openBlock(true), vue.createBlock(vue.Fragment, null, vue.renderList($data.hours, (hr, hIndex) => {
                        return (vue.openBlock(), vue.createBlock(vue.Fragment, { key: hIndex }, [
                          (!$options.opts.hideDisabledHours || ($options.opts.hideDisabledHours && !$options.isDisabled('hour', hr)))
                            ? (vue.openBlock(), vue.createBlock("li", {
                                key: 0,
                                class: {active: $data.hour === hr},
                                disabled: $options.booleanAttr($options.isDisabled('hour', hr)),
                                "data-key": hr,
                                textContent: vue.toDisplayString(hr),
                                onClick: $event => ($options.select('hour', hr))
                              }, null, 10 /* CLASS, PROPS */, ["disabled", "data-key", "textContent", "onClick"]))
                            : vue.createCommentVNode("v-if", true)
                        ], 64 /* STABLE_FRAGMENT */))
                      }), 128 /* KEYED_FRAGMENT */))
                    ], 32 /* HYDRATE_EVENTS */))
                  : vue.createCommentVNode("v-if", true),
                (column === 'minute')
                  ? (vue.openBlock(), vue.createBlock("ul", {
                      key: 1,
                      class: "minutes",
                      onScroll: _cache[15] || (_cache[15] = (...args) => ($options.keepFocusing(...args)))
                    }, [
                      vue.createVNode("li", {
                        class: "hint",
                        textContent: vue.toDisplayString($options.minuteLabelText)
                      }, null, 8 /* PROPS */, ["textContent"]),
                      (vue.openBlock(true), vue.createBlock(vue.Fragment, null, vue.renderList($data.minutes, (m, mIndex) => {
                        return (vue.openBlock(), vue.createBlock(vue.Fragment, { key: mIndex }, [
                          (!$options.opts.hideDisabledMinutes || ($options.opts.hideDisabledMinutes && !$options.isDisabled('minute', m)))
                            ? (vue.openBlock(), vue.createBlock("li", {
                                key: 0,
                                class: {active: $data.minute === m},
                                disabled: $options.booleanAttr($options.isDisabled('minute', m)),
                                "data-key": m,
                                textContent: vue.toDisplayString(m),
                                onClick: $event => ($options.select('minute', m))
                              }, null, 10 /* CLASS, PROPS */, ["disabled", "data-key", "textContent", "onClick"]))
                            : vue.createCommentVNode("v-if", true)
                        ], 64 /* STABLE_FRAGMENT */))
                      }), 128 /* KEYED_FRAGMENT */))
                    ], 32 /* HYDRATE_EVENTS */))
                  : vue.createCommentVNode("v-if", true),
                (column === 'second')
                  ? (vue.openBlock(), vue.createBlock("ul", {
                      key: 2,
                      class: "seconds",
                      onScroll: _cache[16] || (_cache[16] = (...args) => ($options.keepFocusing(...args)))
                    }, [
                      vue.createVNode("li", {
                        class: "hint",
                        textContent: vue.toDisplayString($options.secondLabelText)
                      }, null, 8 /* PROPS */, ["textContent"]),
                      (vue.openBlock(true), vue.createBlock(vue.Fragment, null, vue.renderList($data.seconds, (s, sIndex) => {
                        return (vue.openBlock(), vue.createBlock(vue.Fragment, { key: sIndex }, [
                          (!$options.opts.hideDisabledSeconds || ($options.opts.hideDisabledSeconds && !$options.isDisabled('second', s)))
                            ? (vue.openBlock(), vue.createBlock("li", {
                                key: 0,
                                class: {active: $data.second === s},
                                disabled: $options.booleanAttr($options.isDisabled('second', s)),
                                "data-key": s,
                                textContent: vue.toDisplayString(s),
                                onClick: $event => ($options.select('second', s))
                              }, null, 10 /* CLASS, PROPS */, ["disabled", "data-key", "textContent", "onClick"]))
                            : vue.createCommentVNode("v-if", true)
                        ], 64 /* STABLE_FRAGMENT */))
                      }), 128 /* KEYED_FRAGMENT */))
                    ], 32 /* HYDRATE_EVENTS */))
                  : vue.createCommentVNode("v-if", true),
                (column === 'apm')
                  ? (vue.openBlock(), vue.createBlock("ul", {
                      key: 3,
                      class: "apms",
                      onScroll: _cache[17] || (_cache[17] = (...args) => ($options.keepFocusing(...args)))
                    }, [
                      vue.createVNode("li", {
                        class: "hint",
                        textContent: vue.toDisplayString($options.apmLabelText)
                      }, null, 8 /* PROPS */, ["textContent"]),
                      (vue.openBlock(true), vue.createBlock(vue.Fragment, null, vue.renderList($data.apms, (a, aIndex) => {
                        return (vue.openBlock(), vue.createBlock(vue.Fragment, { key: aIndex }, [
                          (!$options.opts.hideDisabledHours || ($options.opts.hideDisabledHours && !$options.isDisabled('apm', a)))
                            ? (vue.openBlock(), vue.createBlock("li", {
                                key: 0,
                                class: {active: $data.apm === a},
                                disabled: $options.booleanAttr($options.isDisabled('apm', a)),
                                "data-key": a,
                                textContent: vue.toDisplayString($options.apmDisplayText(a)),
                                onClick: $event => ($options.select('apm', a))
                              }, null, 10 /* CLASS, PROPS */, ["disabled", "data-key", "textContent", "onClick"]))
                            : vue.createCommentVNode("v-if", true)
                        ], 64 /* STABLE_FRAGMENT */))
                      }), 128 /* KEYED_FRAGMENT */))
                    ], 32 /* HYDRATE_EVENTS */))
                  : vue.createCommentVNode("v-if", true)
              ], 64 /* STABLE_FRAGMENT */))
            }), 128 /* KEYED_FRAGMENT */))
          : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" / Common Keyboard Support "),
        vue.createCommentVNode("\n        Advanced Keyboard Support\n        Addeds hundreds of additional event lisenters\n      "),
        ($props.advancedKeyboard)
          ? (vue.openBlock(true), vue.createBlock(vue.Fragment, { key: 1 }, vue.renderList($options.columnsSequence, (column) => {
              return (vue.openBlock(), vue.createBlock(vue.Fragment, { key: column }, [
                (column === 'hour')
                  ? (vue.openBlock(), vue.createBlock("ul", {
                      key: 0,
                      class: "hours",
                      tabindex: "-1",
                      onScroll: _cache[23] || (_cache[23] = (...args) => ($options.keepFocusing(...args)))
                    }, [
                      vue.createVNode("li", {
                        class: "hint",
                        textContent: vue.toDisplayString($options.hourLabelText),
                        tabindex: "-1"
                      }, null, 8 /* PROPS */, ["textContent"]),
                      (vue.openBlock(true), vue.createBlock(vue.Fragment, null, vue.renderList($data.hours, (hr, hIndex) => {
                        return (vue.openBlock(), vue.createBlock(vue.Fragment, { key: hIndex }, [
                          (!$options.opts.hideDisabledHours || ($options.opts.hideDisabledHours && !$options.isDisabled('hour', hr)))
                            ? (vue.openBlock(), vue.createBlock("li", {
                                key: 0,
                                class: {active: $data.hour === hr},
                                tabindex: $options.isDisabled('hour', hr) ? -1 : $props.tabindex,
                                "data-key": hr,
                                disabled: $options.booleanAttr($options.isDisabled('hour', hr)),
                                textContent: vue.toDisplayString(hr),
                                onClick: $event => ($options.select('hour', hr)),
                                onKeydown: [
                                  vue.withKeys(vue.withModifiers($event => ($options.select('hour', hr)), ["prevent"]), ["space"]),
                                  vue.withKeys(vue.withModifiers($event => ($options.select('hour', hr)), ["prevent"]), ["enter"]),
                                  vue.withKeys(vue.withModifiers($event => ($options.prevItem('hour', hr)), ["prevent"]), ["up"]),
                                  vue.withKeys(vue.withModifiers($event => ($options.nextItem('hour', hr)), ["prevent"]), ["down"]),
                                  _cache[18] || (_cache[18] = vue.withKeys(vue.withModifiers($event => ($options.toLeftColumn('hour')), ["prevent"]), ["left"])),
                                  _cache[19] || (_cache[19] = vue.withKeys(vue.withModifiers($event => ($options.toRightColumn('hour')), ["prevent"]), ["right"])),
                                  _cache[20] || (_cache[20] = vue.withKeys(vue.withModifiers((...args) => ($options.debounceBlur(...args)), ["exact"]), ["esc"]))
                                ],
                                onBlur: _cache[21] || (_cache[21] = (...args) => ($options.debounceBlur(...args))),
                                onFocus: _cache[22] || (_cache[22] = (...args) => ($options.keepFocusing(...args)))
                              }, null, 42 /* CLASS, PROPS, HYDRATE_EVENTS */, ["tabindex", "data-key", "disabled", "textContent", "onClick", "onKeydown"]))
                            : vue.createCommentVNode("v-if", true)
                        ], 64 /* STABLE_FRAGMENT */))
                      }), 128 /* KEYED_FRAGMENT */))
                    ], 32 /* HYDRATE_EVENTS */))
                  : vue.createCommentVNode("v-if", true),
                (column === 'minute')
                  ? (vue.openBlock(), vue.createBlock("ul", {
                      key: 1,
                      class: "minutes",
                      tabindex: "-1",
                      onScroll: _cache[29] || (_cache[29] = (...args) => ($options.keepFocusing(...args)))
                    }, [
                      vue.createVNode("li", {
                        class: "hint",
                        textContent: vue.toDisplayString($options.minuteLabelText),
                        tabindex: "-1"
                      }, null, 8 /* PROPS */, ["textContent"]),
                      (vue.openBlock(true), vue.createBlock(vue.Fragment, null, vue.renderList($data.minutes, (m, mIndex) => {
                        return (vue.openBlock(), vue.createBlock(vue.Fragment, { key: mIndex }, [
                          (!$options.opts.hideDisabledMinutes || ($options.opts.hideDisabledMinutes && !$options.isDisabled('minute', m)))
                            ? (vue.openBlock(), vue.createBlock("li", {
                                key: 0,
                                class: {active: $data.minute === m},
                                tabindex: $options.isDisabled('minute', m) ? -1 : $props.tabindex,
                                "data-key": m,
                                disabled: $options.booleanAttr($options.isDisabled('minute', m)),
                                textContent: vue.toDisplayString(m),
                                onClick: $event => ($options.select('minute', m)),
                                onKeydown: [
                                  vue.withKeys(vue.withModifiers($event => ($options.select('minute', m)), ["prevent"]), ["space"]),
                                  vue.withKeys(vue.withModifiers($event => ($options.select('minute', m)), ["prevent"]), ["enter"]),
                                  vue.withKeys(vue.withModifiers($event => ($options.prevItem('minute', m)), ["prevent"]), ["up"]),
                                  vue.withKeys(vue.withModifiers($event => ($options.nextItem('minute', m)), ["prevent"]), ["down"]),
                                  _cache[24] || (_cache[24] = vue.withKeys(vue.withModifiers($event => ($options.toLeftColumn('minute')), ["prevent"]), ["left"])),
                                  _cache[25] || (_cache[25] = vue.withKeys(vue.withModifiers($event => ($options.toRightColumn('minute')), ["prevent"]), ["right"])),
                                  _cache[26] || (_cache[26] = vue.withKeys(vue.withModifiers((...args) => ($options.debounceBlur(...args)), ["exact"]), ["esc"]))
                                ],
                                onBlur: _cache[27] || (_cache[27] = (...args) => ($options.debounceBlur(...args))),
                                onFocus: _cache[28] || (_cache[28] = (...args) => ($options.keepFocusing(...args)))
                              }, null, 42 /* CLASS, PROPS, HYDRATE_EVENTS */, ["tabindex", "data-key", "disabled", "textContent", "onClick", "onKeydown"]))
                            : vue.createCommentVNode("v-if", true)
                        ], 64 /* STABLE_FRAGMENT */))
                      }), 128 /* KEYED_FRAGMENT */))
                    ], 32 /* HYDRATE_EVENTS */))
                  : vue.createCommentVNode("v-if", true),
                (column === 'second')
                  ? (vue.openBlock(), vue.createBlock("ul", {
                      key: 2,
                      class: "seconds",
                      tabindex: "-1",
                      onScroll: _cache[35] || (_cache[35] = (...args) => ($options.keepFocusing(...args)))
                    }, [
                      vue.createVNode("li", {
                        class: "hint",
                        textContent: vue.toDisplayString($options.secondLabelText),
                        tabindex: "-1"
                      }, null, 8 /* PROPS */, ["textContent"]),
                      (vue.openBlock(true), vue.createBlock(vue.Fragment, null, vue.renderList($data.seconds, (s, sIndex) => {
                        return (vue.openBlock(), vue.createBlock(vue.Fragment, { key: sIndex }, [
                          (!$options.opts.hideDisabledSeconds || ($options.opts.hideDisabledSeconds && !$options.isDisabled('second', s)))
                            ? (vue.openBlock(), vue.createBlock("li", {
                                key: 0,
                                class: {active: $data.second === s},
                                tabindex: $options.isDisabled('second', s) ? -1 : $props.tabindex,
                                "data-key": s,
                                disabled: $options.booleanAttr($options.isDisabled('second', s)),
                                textContent: vue.toDisplayString(s),
                                onClick: $event => ($options.select('second', s)),
                                onKeydown: [
                                  vue.withKeys(vue.withModifiers($event => ($options.select('second', s)), ["prevent"]), ["space"]),
                                  vue.withKeys(vue.withModifiers($event => ($options.select('second', s)), ["prevent"]), ["enter"]),
                                  vue.withKeys(vue.withModifiers($event => ($options.prevItem('second', s)), ["prevent"]), ["up"]),
                                  vue.withKeys(vue.withModifiers($event => ($options.nextItem('second', s)), ["prevent"]), ["down"]),
                                  _cache[30] || (_cache[30] = vue.withKeys(vue.withModifiers($event => ($options.toLeftColumn('second')), ["prevent"]), ["left"])),
                                  _cache[31] || (_cache[31] = vue.withKeys(vue.withModifiers($event => ($options.toRightColumn('second')), ["prevent"]), ["right"])),
                                  _cache[32] || (_cache[32] = vue.withKeys(vue.withModifiers((...args) => ($options.debounceBlur(...args)), ["exact"]), ["esc"]))
                                ],
                                onBlur: _cache[33] || (_cache[33] = (...args) => ($options.debounceBlur(...args))),
                                onFocus: _cache[34] || (_cache[34] = (...args) => ($options.keepFocusing(...args)))
                              }, null, 42 /* CLASS, PROPS, HYDRATE_EVENTS */, ["tabindex", "data-key", "disabled", "textContent", "onClick", "onKeydown"]))
                            : vue.createCommentVNode("v-if", true)
                        ], 64 /* STABLE_FRAGMENT */))
                      }), 128 /* KEYED_FRAGMENT */))
                    ], 32 /* HYDRATE_EVENTS */))
                  : vue.createCommentVNode("v-if", true),
                (column === 'apm')
                  ? (vue.openBlock(), vue.createBlock("ul", {
                      key: 3,
                      class: "apms",
                      tabindex: "-1",
                      onScroll: _cache[41] || (_cache[41] = (...args) => ($options.keepFocusing(...args)))
                    }, [
                      vue.createVNode("li", {
                        class: "hint",
                        textContent: vue.toDisplayString($options.apmLabelText),
                        tabindex: "-1"
                      }, null, 8 /* PROPS */, ["textContent"]),
                      (vue.openBlock(true), vue.createBlock(vue.Fragment, null, vue.renderList($data.apms, (a, aIndex) => {
                        return (vue.openBlock(), vue.createBlock(vue.Fragment, { key: aIndex }, [
                          (!$options.opts.hideDisabledHours || ($options.opts.hideDisabledHours && !$options.isDisabled('apm', a)))
                            ? (vue.openBlock(), vue.createBlock("li", {
                                key: 0,
                                class: {active: $data.apm === a},
                                tabindex: $options.isDisabled('apm', a) ? -1 : $props.tabindex,
                                "data-key": a,
                                disabled: $options.booleanAttr($options.isDisabled('apm', a)),
                                textContent: vue.toDisplayString($options.apmDisplayText(a)),
                                onClick: $event => ($options.select('apm', a)),
                                onKeydown: [
                                  vue.withKeys(vue.withModifiers($event => ($options.select('apm', a)), ["prevent"]), ["space"]),
                                  vue.withKeys(vue.withModifiers($event => ($options.select('apm', a)), ["prevent"]), ["enter"]),
                                  vue.withKeys(vue.withModifiers($event => ($options.prevItem('apm', a)), ["prevent"]), ["up"]),
                                  vue.withKeys(vue.withModifiers($event => ($options.nextItem('apm', a)), ["prevent"]), ["down"]),
                                  _cache[36] || (_cache[36] = vue.withKeys(vue.withModifiers($event => ($options.toLeftColumn('apm')), ["prevent"]), ["left"])),
                                  _cache[37] || (_cache[37] = vue.withKeys(vue.withModifiers($event => ($options.toRightColumn('apm')), ["prevent"]), ["right"])),
                                  _cache[38] || (_cache[38] = vue.withKeys(vue.withModifiers((...args) => ($options.debounceBlur(...args)), ["exact"]), ["esc"]))
                                ],
                                onBlur: _cache[39] || (_cache[39] = (...args) => ($options.debounceBlur(...args))),
                                onFocus: _cache[40] || (_cache[40] = (...args) => ($options.keepFocusing(...args)))
                              }, null, 42 /* CLASS, PROPS, HYDRATE_EVENTS */, ["tabindex", "data-key", "disabled", "textContent", "onClick", "onKeydown"]))
                            : vue.createCommentVNode("v-if", true)
                        ], 64 /* STABLE_FRAGMENT */))
                      }), 128 /* KEYED_FRAGMENT */))
                    ], 32 /* HYDRATE_EVENTS */))
                  : vue.createCommentVNode("v-if", true)
              ], 64 /* STABLE_FRAGMENT */))
            }), 128 /* KEYED_FRAGMENT */))
          : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" / Advanced Keyboard Support ")
      ], 4 /* STYLE */)
    ], 38 /* CLASS, STYLE, HYDRATE_EVENTS */), [
      [vue.vShow, $data.showDropdown]
    ])
  ], 4 /* STYLE */))
}

script.render = render;
script.__file = "src/VueTimepicker.vue";

module.exports = script;
//# sourceMappingURL=VueTimepikcer.cjs.js.map
