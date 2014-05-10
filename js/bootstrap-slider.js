/* =========================================================
 * bootstrap-slider.js v3.0.0
 * http://www.eyecon.ro/bootstrap-slider
 * =========================================================
 * Copyright 2012 Stefan Petre
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */

(function( $ ) {
    var ErrorMsgs = {
        formatInvalidInputErrorMsg : function(input) {
            return "Invalid input value '" + input + "' passed in";
        },
        callingContextNotSliderInstance : "Calling context element does not have instance of Slider bound to it. Check your code to make sure the JQuery object returned from the call to the slider() initializer is calling the method"
    };

    var TooltipPositioners = {
        main: {
            horizontal: {
                className: 'top',
                offsetProp: 'top',
                offset: function($elem) {
                    return -$elem.outerHeight() - 14 + 'px';
                }
            },
            vertical: {
                className: 'right',
                offsetProp: 'left',
                offset: function() {
                    return '0px';
                }
            }
        },
        aux: {
            horizontal: {
                className: 'bottom',
                offsetProp: 'top',
                offset: function($elem) {
                    return $elem.parent().outerHeight() - 4 + 'px';
                }
            },
            vertical: {
                className: 'left',
                offsetProp: 'right',
                offset: function() {
                    return '0px';
                }
            }
        }
    };

    var Slider = function(element, options) {
        var slider = this;
        var el = this.element = $(element).hide();
        var origWidth =  $(element)[0].style.width;

        var updateSlider = false;
        var parent = this.element.parent();


        if (parent.hasClass('slider') === true) {
            updateSlider = true;
            this.picker = parent;
        } else {
            this.picker = $('<div class="slider">'+
                '<div class="slider-track">'+
                '<div class="slider-selection"></div>'+
                '<div class="slider-handle"></div>'+
                '<div class="slider-handle"></div>'+
                '</div>'+
                '</div>')
                .insertBefore(this.element)
                .append(this.element);
            if (options.tooltip) {
                // old tooltip settings API used
                [
                    ['main_tooltip', 'tooltip'],
                    ['main_tooltip_formater', 'formater'],
                    ['main_tooltip_split', 'tooltip_split'],
                    ['main_tooltip_separator', 'tooltip_separator']
                ].forEach(function (newOld) {
                        options[newOld[0]] = options[newOld[1]] || options[newOld[0]];
                    });
            }
            var oldMainMode;
            if (oldMainMode = slider.element.data('slider-tooltip')) {
                options.main_tooltip = oldMainMode;
            }
            this.tooltipNames.forEach(function(tooltipName) {
                var tooltip = {},
                    markup = '<div class="tooltip tooltip-' + tooltipName + '"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'+
                        '<div class="tooltip tooltip-' + tooltipName + '-min"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'+
                        '<div class="tooltip tooltip-' + tooltipName + '-max"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>';

                slider.picker.append(markup);
                slider.tooltips.push(tooltip);

                tooltip.name = tooltipName;
                tooltip.$main = slider.picker.find('.tooltip-' + tooltipName);
                tooltip.$min = slider.picker.find('.tooltip-' + tooltipName + '-min');
                tooltip.$max = slider.picker.find('.tooltip-' + tooltipName + '-max');
                tooltip.positioner = TooltipPositioners[tooltipName];
                tooltip.formatter = options[tooltipName + '_tooltip_formater'];
                tooltip.separator = options[tooltipName + '_tooltip_separator'];
                tooltip.shouldSplit = options[tooltipName + '_tooltip_split'];
                tooltip.show = slider.tooltipShowCallback(tooltip);
                tooltip.hide = slider.tooltipHideCallback(tooltip);
                tooltip.mode =
                    slider.element.data('slider-' + tooltipName + '-tooltip') || options[tooltipName + '_tooltip'];
            });
        }

        this.id = this.element.data('slider-id')||options.id;
        if (this.id) {
            this.picker[0].id = this.id;
        }

        if (typeof Modernizr !== 'undefined' && Modernizr.touch) {
            this.touchCapable = true;
        }

        if (updateSlider === true) {
            // Reset classes
            this.picker.removeClass('slider-horizontal');
            this.picker.removeClass('slider-vertical');
            this.tooltips.forEach(function(tooltip) {
                '$min,$max,$main'.split(',').forEach(function(elemName) {
                    tooltip[elemName].removeClass('hide');
                });
            });
        }

        this.orientation = this.element.data('slider-orientation')||options.orientation;
        switch(this.orientation) {
            case 'vertical':
                this.picker.addClass('slider-vertical');
                this.stylePos = 'top';
                this.mousePos = 'pageY';
                this.sizePos = 'offsetHeight';
                break;
            default:
                this.picker
                    .addClass('slider-horizontal')
                    .css('width', origWidth);
                this.orientation = 'horizontal';
                this.stylePos = 'left';
                this.mousePos = 'pageX';
                this.sizePos = 'offsetWidth';
                break;
        }
        this.tooltips.forEach(function(tooltip) {
            var positioner = tooltip.positioner[slider.orientation]
            '$min,$max,$main'.split(',').forEach(function($elemName) {
                var $elem = tooltip[$elemName];
                $elem.addClass(positioner.className)[0].style[positioner.offsetProp] = positioner.offset($elem);
            });
        });


        var self = this;
        $.each(['min', 'max', 'step', 'value'], function(i, attr) {
            if (typeof el.data('slider-' + attr) !== 'undefined') {
                self[attr] = el.data('slider-' + attr);
            } else if (typeof options[attr] !== 'undefined') {
                self[attr] = options[attr];
            } else if (typeof el.prop(attr) !== 'undefined') {
                self[attr] = el.prop(attr);
            } else {
                self[attr] = 0; // to prevent empty string issues in calculations in IE
            }
        });

        if (this.value instanceof Array) {
            if (updateSlider && !this.range) {
                this.value = this.value[0];
            } else {
                this.range = true;
            }
        } else if (this.range) {
            // User wants a range, but value is not an array
            this.value = [this.value, this.max];
        }

        this.selection = this.element.data('slider-selection')||options.selection;
        this.selectionEl = this.picker.find('.slider-selection');
        if (this.selection === 'none') {
            this.selectionEl.addClass('hide');
        }

        this.selectionElStyle = this.selectionEl[0].style;

        this.handle1 = this.picker.find('.slider-handle:first');
        this.handle1Stype = this.handle1[0].style;

        this.handle2 = this.picker.find('.slider-handle:last');
        this.handle2Stype = this.handle2[0].style;

        if (updateSlider === true) {
            // Reset classes
            this.handle1.removeClass('round triangle');
            this.handle2.removeClass('round triangle hide');
        }

        var handle = this.element.data('slider-handle')||options.handle;
        switch(handle) {
            case 'round':
                this.handle1.addClass('round');
                this.handle2.addClass('round');
                break;
            case 'triangle':
                this.handle1.addClass('triangle');
                this.handle2.addClass('triangle');
                break;
        }

        if (this.range) {
            this.value[0] = Math.max(this.min, Math.min(this.max, this.value[0]));
            this.value[1] = Math.max(this.min, Math.min(this.max, this.value[1]));
        } else {
            this.value = [ Math.max(this.min, Math.min(this.max, this.value))];
            this.handle2.addClass('hide');
            if (this.selection === 'after') {
                this.value[1] = this.max;
            } else {
                this.value[1] = this.min;
            }
        }
        this.diff = this.max - this.min;
        this.percentage = [
                (this.value[0]-this.min)*100/this.diff,
                (this.value[1]-this.min)*100/this.diff,
                this.step*100/this.diff
        ];

        this.offset = this.picker.offset();
        this.size = this.picker[0][this.sizePos];

        this.reversed = this.element.data('slider-reversed')||options.reversed;

        this.layout();
        this.layout();

        this.handle1.on({
            keydown: $.proxy(this.keydown, this, 0)
        });

        this.handle2.on({
            keydown: $.proxy(this.keydown, this, 1)
        });

        if (this.touchCapable) {
            // Touch: Bind touch events:
            this.picker.on({
                touchstart: $.proxy(this.mousedown, this)
            });
        } else {
            this.picker.on({
                mousedown: $.proxy(this.mousedown, this)
            });
        }

        this.tooltips.forEach(function(tooltip) {
            if (tooltip.mode === 'hide') {
                '$min,$max,$main'.split(',').forEach(function(elemName) {
                    tooltip[elemName].addClass('hide');
                });
            } else if (tooltip.mode === 'always') {
                tooltip.show.call(slider);
            } else {
                var showTooltip = tooltip.show, hideTooltip = tooltip.hide;
                slider.picker.on({
                    mouseenter: $.proxy(showTooltip, slider),
                    mouseleave: $.proxy(hideTooltip, slider)
                });
                slider.handle1.on({
                    focus: $.proxy(showTooltip, slider),
                    blur: $.proxy(hideTooltip, slider)
                });
                slider.handle2.on({
                    focus: $.proxy(showTooltip, slider),
                    blur: $.proxy(hideTooltip, slider)
                });
            }
        });

        this.enabled = options.enabled &&
            (this.element.data('slider-enabled') === undefined || this.element.data('slider-enabled') === true);
        if(this.enabled) {
            this.enable();
        } else {
            this.disable();
        }
    };

    Slider.prototype = {
        constructor: Slider,

        lastMouseupEvent: null,
        over: false,
        inDrag: false,
        tooltipNames: ['main', 'aux'],
        tooltips: [],
        tooltipShowCallback: function(tooltip) {
            return function() {
                if (tooltip.shouldSplit === false){
                    tooltip.$main.addClass('in');
                } else {
                    tooltip.$min.addClass('in');
                    tooltip.$max.addClass('in');
                }
                this.over = true;
            };
        },
        tooltipHideCallback: function(tooltip) {
            return function() {
                if (this.inDrag === false && tooltip.mode !== 'always') {
                    '$min,$max,$main'.split(',').forEach(function(elemName) {
                        tooltip[elemName].removeClass('in');
                    });
                }
                this.over = false;
            };
        },

        layout: function(){
            var positionPercentages;
            var slider = this;

            if(this.reversed) {
                positionPercentages = [ 100 - this.percentage[0], this.percentage[1] ];
            } else {
                positionPercentages = [ this.percentage[0], this.percentage[1] ];
            }

            this.handle1Stype[this.stylePos] = positionPercentages[0]+'%';
            this.handle2Stype[this.stylePos] = positionPercentages[1]+'%';

            if (this.orientation === 'vertical') {
                this.selectionElStyle.top = Math.min(positionPercentages[0], positionPercentages[1]) +'%';
                this.selectionElStyle.height = Math.abs(positionPercentages[0] - positionPercentages[1]) +'%';
            } else {
                this.selectionElStyle.left = Math.min(positionPercentages[0], positionPercentages[1]) +'%';
                this.selectionElStyle.width = Math.abs(positionPercentages[0] - positionPercentages[1]) +'%';
            }

            if (this.range) {
                this.tooltips.forEach(function(tooltip) {
                    tooltip.$main.find('.tooltip-inner').text(
                            tooltip.formatter(slider.value[0]) + tooltip.separator + tooltip.formatter(slider.value[1])
                    );
                    tooltip.$min.find('.tooltip-inner').text(
                        tooltip.formatter(slider.value[0])
                    );
                    tooltip.$max.find('.tooltip-inner').text(
                        tooltip.formatter(slider.value[1])
                    );

                    tooltip.$main[0].style[slider.stylePos] = slider.size * (positionPercentages[0] + (positionPercentages[1] - positionPercentages[0])/2)/100 - (slider.orientation === 'vertical' ? tooltip.$main.outerHeight()/2 : tooltip.$main.outerWidth()/2) +'px';
                    tooltip.$min[0].style[slider.stylePos] = slider.size * ((positionPercentages[0])/100) - (slider.orientation === 'vertical' ? tooltip.$min.outerHeight()/2 : tooltip.$min.outerWidth()/2) +'px';
                    tooltip.$max[0].style[slider.stylePos] = slider.size * ((positionPercentages[1])/100) - (slider.orientation === 'vertical' ? tooltip.$max.outerHeight()/2 : tooltip.$max.outerWidth()/2) +'px';
                });
            } else {
                this.tooltips.forEach(function(tooltip) {
                    tooltip.$main.find('.tooltip-inner').text(
                        tooltip.formatter(slider.value[0])
                    );
                    tooltip.$main[0].style[slider.stylePos] = slider.size * positionPercentages[0]/100 - (slider.orientation === 'vertical' ? tooltip.$main.outerHeight()/2 : tooltip.$main.outerWidth()/2) +'px';
                });
            }
        },

        mousedown: function(ev) {
            if(!this.isEnabled()) {
                return false;
            }
            // Touch: Get the original event:
            if (this.touchCapable && ev.type === 'touchstart') {
                ev = ev.originalEvent;
            }

            this.triggerFocusOnHandle();

            this.offset = this.picker.offset();
            this.size = this.picker[0][this.sizePos];

            var percentage = this.getPercentage(ev);

            if (this.range) {
                var diff1 = Math.abs(this.percentage[0] - percentage);
                var diff2 = Math.abs(this.percentage[1] - percentage);
                this.dragged = (diff1 < diff2) ? 0 : 1;
            } else {
                this.dragged = 0;
            }

            this.percentage[this.dragged] = this.reversed ? 100 - percentage : percentage;
            this.layout();

            if (this.touchCapable) {
                // Touch: Bind touch events:
                $(document).on({
                    touchmove: $.proxy(this.mousemove, this),
                    touchend: $.proxy(this.mouseup, this)
                });
            } else {
                $(document).on({
                    mousemove: $.proxy(this.mousemove, this),
                    mouseup: $.proxy(this.mouseup, this)
                });
            }

            this.inDrag = true;
            var val = this.calculateValue();
            this.setValue(val);
            this.element.trigger({
                type: 'slideStart',
                value: val
            }).trigger({
                type: 'slide',
                value: val
            });
            return true;
        },

        triggerFocusOnHandle: function(handleIdx) {
            if(handleIdx === 0) {
                this.handle1.focus();
            }
            if(handleIdx === 1) {
                this.handle2.focus();
            }
        },

        keydown: function(handleIdx, ev) {
            if(!this.isEnabled()) {
                return false;
            }

            var dir;
            switch (ev.which) {
                case 37: // left
                case 40: // down
                    dir = -1;
                    break;
                case 39: // right
                case 38: // up
                    dir = 1;
                    break;
            }
            if (!dir) {
                return;
            }

            var oneStepValuePercentageChange = dir * this.percentage[2];
            var percentage = this.percentage[handleIdx] + oneStepValuePercentageChange;

            if (percentage > 100) {
                percentage = 100;
            } else if (percentage < 0) {
                percentage = 0;
            }

            this.dragged = handleIdx;
            this.adjustPercentageForRangeSliders(percentage);
            this.percentage[this.dragged] = percentage;
            this.layout();

            var val = this.calculateValue();
            this.setValue(val);
            this.element
                .trigger({
                    type: 'slide',
                    value: val
                })
                .trigger({
                    type: 'slideStop',
                    value: val
                })
                .data('value', val)
                .prop('value', val);
            return false;
        },

        mousemove: function(ev) {
            if(!this.isEnabled()) {
                return false;
            }
            // Touch: Get the original event:
            if (this.touchCapable && ev.type === 'touchmove') {
                ev = ev.originalEvent;
            }

            var percentage = this.getPercentage(ev);
            this.adjustPercentageForRangeSliders(percentage);
            this.percentage[this.dragged] = this.reversed ? 100 - percentage : percentage;
            this.layout();

            var val = this.calculateValue();
            this.setValue(val);
            this.element
                .trigger({
                    type: 'slide',
                    value: val
                })
                .data('value', val)
                .prop('value', val);
            return false;
        },

        adjustPercentageForRangeSliders: function(percentage) {
            if (this.range) {
                if (this.dragged === 0 && this.percentage[1] < percentage) {
                    this.percentage[0] = this.percentage[1];
                    this.dragged = 1;
                } else if (this.dragged === 1 && this.percentage[0] > percentage) {
                    this.percentage[1] = this.percentage[0];
                    this.dragged = 0;
                }
            }
        },

        mouseup: function(ev) {
            if (ev === this.lastMouseupEvent) {
                return false;
            } else {
                this.lastMouseupEvent = ev;
            }
            if(!this.isEnabled()) {
                return false;
            }
            if (this.touchCapable) {
                // Touch: Bind touch events:
                $(document).off({
                    touchmove: this.mousemove,
                    touchend: this.mouseup
                });
            } else {
                $(document).off({
                    mousemove: this.mousemove,
                    mouseup: this.mouseup
                });
            }

            this.inDrag = false;
            var val = this.calculateValue();
            this.layout();
            this.element
                .data('value', val)
                .prop('value', val)
                .trigger({
                    type: 'slideStop',
                    value: val
                });
            return false;
        },

        calculateValue: function() {
            var val;
            if (this.range) {
                val = [this.min,this.max];
                if (this.percentage[0] !== 0){
                    val[0] = (Math.max(this.min, this.min + Math.round((this.diff * this.percentage[0]/100)/this.step)*this.step));
                }
                if (this.percentage[1] !== 100){
                    val[1] = (Math.min(this.max, this.min + Math.round((this.diff * this.percentage[1]/100)/this.step)*this.step));
                }
                this.value = val;
            } else {
                val = (this.min + Math.round((this.diff * this.percentage[0]/100)/this.step)*this.step);
                if (val < this.min) {
                    val = this.min;
                }
                else if (val > this.max) {
                    val = this.max;
                }
                val = parseFloat(val);
                this.value = [val, this.value[1]];
            }
            return val;
        },

        getPercentage: function(ev) {
            if (this.touchCapable) {
                ev = ev.touches[0];
            }
            var percentage = (ev[this.mousePos] - this.offset[this.stylePos])*100/this.size;
            percentage = Math.round(percentage/this.percentage[2])*this.percentage[2];
            return Math.max(0, Math.min(100, percentage));
        },

        getValue: function() {
            if (this.range) {
                return this.value;
            }
            return this.value[0];
        },

        setValue: function(val) {
            this.value = this.validateInputValue(val);

            if (this.range) {
                this.value[0] = Math.max(this.min, Math.min(this.max, this.value[0]));
                this.value[1] = Math.max(this.min, Math.min(this.max, this.value[1]));
            } else {
                this.value = [ Math.max(this.min, Math.min(this.max, this.value))];
                this.handle2.addClass('hide');
                if (this.selection === 'after') {
                    this.value[1] = this.max;
                } else {
                    this.value[1] = this.min;
                }
            }
            this.diff = this.max - this.min;
            this.percentage = [
                    (this.value[0]-this.min)*100/this.diff,
                    (this.value[1]-this.min)*100/this.diff,
                    this.step*100/this.diff
            ];
            this.layout();

            this.element
                .trigger({
                    'type': 'slide',
                    'value': this.value
                })
                .data('value', this.value)
                .prop('value', this.value);
        },

        validateInputValue : function(val) {
            if(typeof val === 'number') {
                return val;
            } else if(val instanceof Array) {
                $.each(val, function(i, input) { if (typeof input !== 'number') { throw new Error( ErrorMsgs.formatInvalidInputErrorMsg(input) ); }});
                return val;
            } else {
                throw new Error( ErrorMsgs.formatInvalidInputErrorMsg(val) );
            }
        },

        destroy: function(){
            this.handle1.off();
            this.handle2.off();
            this.element.off().show().insertBefore(this.picker);
            this.picker.off().remove();
            $(this.element).removeData('slider');
        },

        disable: function() {
            this.enabled = false;
            this.handle1.removeAttr("tabindex");
            this.handle2.removeAttr("tabindex");
            this.picker.addClass('slider-disabled');
            this.element.trigger('slideDisabled');
        },

        enable: function() {
            this.enabled = true;
            this.handle1.attr("tabindex", 0);
            this.handle2.attr("tabindex", 0);
            this.picker.removeClass('slider-disabled');
            this.element.trigger('slideEnabled');
        },

        toggle: function() {
            if(this.enabled) {
                this.disable();
            } else {
                this.enable();
            }
        },

        isEnabled: function() {
            return this.enabled;
        },

        setAttribute: function(attribute, value) {
            this[attribute] = value;
        }
    };

    var publicMethods = {
        getValue : Slider.prototype.getValue,
        setValue : Slider.prototype.setValue,
        setAttribute : Slider.prototype.setAttribute,
        destroy : Slider.prototype.destroy,
        disable : Slider.prototype.disable,
        enable : Slider.prototype.enable,
        toggle : Slider.prototype.toggle,
        isEnabled: Slider.prototype.isEnabled
    };

    $.fn.slider = function (option) {
        if (typeof option === 'string' && option !== 'refresh') {
            var args = Array.prototype.slice.call(arguments, 1);
            return invokePublicMethod.call(this, option, args);
        } else {
            return createNewSliderInstance.call(this, option);
        }
    };

    function invokePublicMethod(methodName, args) {
        if(publicMethods[methodName]) {
            var sliderObject = retrieveSliderObjectFromElement(this);
            var result = publicMethods[methodName].apply(sliderObject, args);

            if (typeof result === "undefined") {
                return $(this);
            } else {
                return result;
            }
        } else {
            throw new Error("method '" + methodName + "()' does not exist for slider.");
        }
    }

    function retrieveSliderObjectFromElement(element) {
        var sliderObject = $(element).data('slider');
        if(sliderObject && sliderObject instanceof Slider) {
            return sliderObject;
        } else {
            throw new Error(ErrorMsgs.callingContextNotSliderInstance);
        }
    }

    function createNewSliderInstance(opts) {
        var $this = $(this);
        $this.each(function() {
            var $this = $(this),
                slider = $this.data('slider'),
                options = typeof opts === 'object' && opts;

            // If slider already exists, use its attributes
            // as options so slider refreshes properly
            if (slider && !options) {
                options = {};

                $.each($.fn.slider.defaults, function(key) {
                    options[key] = slider[key];
                });
            }

            $this.data('slider', (new Slider(this, $.extend({}, $.fn.slider.defaults, options))));
        });
        return $this;
    }

    $.fn.slider.defaults = {
        min: 0,
        max: 10,
        step: 1,
        orientation: 'horizontal',
        value: 5,
        range: false,
        selection: 'before',
        main_tooltip: 'show',
        main_tooltip_separator: ':',
        main_tooltip_split: false,
        aux_tooltip: 'hide',
        aux_tooltip_separator: ':',
        aux_tooltip_split: false,
        handle: 'round',
        reversed : false,
        enabled: true,
        main_tooltip_formater: function(value) {
            return value;
        },
        aux_tooltip_formater: function(value) {
            return value;
        }
    };

    $.fn.slider.Constructor = Slider;

})( window.jQuery );
