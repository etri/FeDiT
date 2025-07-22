////////////////////////////////////////////////////////////////////////////////
// EventDispatcher.js
////////////////////////////////////////////////////////////////////////////////
;VIZWeb3D.EventDispatcher = (function(win, doc, ns)
{
    "use strict";
    /**
     * Event object
     * 
     * @param {Object} target
     * @param {String} type
     * @param {Object} data
     * @constructor
     */
    var Event = function(target, type, data)
    {
        this.target = target;
        this.type = type;
        this.data = data;
    };

    /**
     * Event dispatcher
     * @constructor
     */
    var EventDispatcher = function ()
    {
        /*** @type {Object} Event listener */
        var listeners = {};

        /**
         * Add listener
         * @param {String} type Event type
         * @param {Function} listener Callback function
         */
        this.addEventListener = function(type, listener)
        {
            (listeners[type] || (listeners[type] = [])).push(listener);
        };

        /**
         * Has listener
         * @param {String} type Event type
         * @return {Boolean}
         */
        this.hasEventListener = function(type)
        {
            return !!(listeners[type] || []).length;
        };

        /**
         * Remove listener
         * @param {String} type Event type
         * @param {Function} listener Callback function
         */
        this.removeEventListener = function(type, listener)
        {
            var fncs = listeners[type];

            if(fncs)
            {
                for (var i = fncs.length-1; i >= 0; i--)
                {
                    if (fncs[i] === listener)
                    {
                        fncs.splice(i, 1);
                    }
                }
            }
        };

        /**
         * Reset listener
         * @param {String} type Event type
         */
        this.resetEventListener = function(type)
        {
            if (type)
            {
                listeners[type] = [];
            }
            else
            {
                listeners = {};
            }
        };

        /**
         * Clear listener
         */
        this.destory = function()
        {
            listeners = null;
        };

        /**
         * One event listener
         * @param {String} type Event type
         * @param {Function} listener Callback function
         */
        this.oneEventListener = function(type, listener)
        {
            var self = this,
                callback = function (event)
                {
                    self.removeEventListener(type, callback);
                    listener.apply(self, [event]);
                    callback = null;
                };

            this.addEventListener(type, callback);
        };

        /**
         * Dispatch event message
         * @param {String} type Event type
         * @param {Object} data Attach data
         */
        this.dispatchEvent = function (type, data) {
            var fncs = listeners[type],
                event;

            if (fncs) {
                fncs = fncs.concat();
                event = new Event(this, type, data);
                for (var i = 0, n = fncs.length; i < n; i++) {
                    fncs[i].apply(this, [event]);
                }
            }
        };
    };

    //--------------------------------------------------------------------------
    //  Private Method
    //--------------------------------------------------------------------------

    //--------------------------------------------------------------------------
    //  Export
    //--------------------------------------------------------------------------
    return EventDispatcher;

})(window, document, window.namespace);