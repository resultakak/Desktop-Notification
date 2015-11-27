/**
 * Desktop Notification API
 *
 * @author TruongLv <truonglv[at]outlook.com>
 */
(function(window, document)
{
	/**
	 * Create Notify function with base data initialized
	 *
	 * @return function
	 */
	var Notify = function() 
	{
		// Factory when initialized function
		this.supported = null;
		this.available();

		/**
		 * Cache all notification which be sent
		 *
		 * @var array
		 */
		this.cached = [];

		this.PERMISSION_GRANTED = 'granted';
		this.PERMISSION_DENIED 	= 'denied';
		this.PERMISSION_DEFAULT = 'default';

		return this;
	};

	/**
	 * Determine the notification available with the current browser
	 *
	 * @return boolean
	 */
	Notify.prototype.available = function() 
	{
		if(this.supported === null) 
		{
			try
			{
				this.supported = !!(window.Notification /* Safari, Chrome */
					|| window.webkitNotifications /* Chrome & ff-html5notifications plugin */
					|| navigator.mozNotification /* Firefox Mobile */
					|| (window.external && window.external.msIsSiteMode() !== undefined) /* IE9+ */
				);
			}
			catch(e)
			{
				this.supported = false;
			}
		}

		return Boolean(this.supported);
	};

	/**
	 * Ask permission which allow receive or deny notification
	 * @param callback function which being used while request permission
	 *
	 * @return void
	 */
	Notify.prototype.requestPermission = function(callback)
	{
		if(!this.available())
		{
			return;
		}

		var callable = typeof callback === 'function' ? callback : function() {};

		if (window.webkitNotifications && window.webkitNotifications.checkPermission) 
		{
            /*
             * Chrome 23 supports window.Notification.requestPermission, but it
             * breaks the browsers, so use the old-webkit-prefixed
             * window.webkitNotifications.checkPermission instead.
             *
             * Firefox with html5notifications plugin supports this method
             * for requesting permissions.
             */
            window.webkitNotifications.requestPermission(callable);
        } 
        else if (window.Notification && window.Notification.requestPermission) 
        {
            window.Notification.requestPermission(callable);
        }
	};

	/**
	 * Show the current permission status of desktop notification
	 *
	 * @return string|false 
	 *		- string of permission status
	 *		- false if the browser did not support desktop notification
	 */
	Notify.prototype.permissionStatus = function()
	{
		if(!this.available())
		{
			return false;
		}

		var permission = '';

		if (window.Notification && window.Notification.permissionLevel) 
		{
            // Safari 6
            permission = window.Notification.permissionLevel();
        }
        else if (window.Notification && window.Notification.permission) 
        {
            // Firefox 23+
            permission = window.Notification.permission;
        } 
        else if (navigator.mozNotification) 
        {
            // Support Firefox Mobile
            permission = this.PERMISSION_GRANTED;
        } 
        else if (window.external && (window.external.msIsSiteMode() !== undefined)) 
        {
            // Support IE9+
            permission = window.external.msIsSiteMode() ? this.PERMISSION_GRANTED : this.PERMISSION_DEFAULT;
        }

        return permission;
	};

	/**
	 * Send an notify through desktop notification
	 *
	 * @param string title of notify
	 * @param string content of notify
	 * @param string the URL path to icon which will be display in notify
	 * @param object group of callbacks
	 * 				- onclick: function fired when user click to notify
	 * 				- onclose: function fired when notification being closed
	 * 				- onshow: function fired when an notification being shown
	 * @param boolean determine to clear all previous notifications
	 *
	 * @return boolean
	 */
	Notify.prototype.send = function(title, message, icon, callbacks, isRemoveAll)
	{
		if(this.permissionStatus() !== this.PERMISSION_GRANTED)
		{
			// Not granted permission. You could not send
			// an notification to user
			return false;
		}

		if (isRemoveAll)
		{
			this.removeAll();
		}

		var notification;

		if (window.external && window.external.msIsSiteMode)
		{
			if (window.external.msIsSiteMode())
			{
				window.external.msSiteModeClearIconOverlay();
				window.external.msSiteModeActivate();
				window.external.msSiteModeSetIconOverlay(icon, message);
			}
		}
		else if (window.webkitNotifications)
		{
			notification = window.webkitNotifications.createNotification(icon, title, message);
		}
		else if (window.mozNotification)
		{
			notification = window.mozNotification.createNotification(title, message, icon);
		}
		else if (window.Notification)
		{
			notification = new window.Notification(title, {
				icon: icon,
				body: message
			});
		}

		if(typeof notification === 'object')
		{
			notification.onclick = (typeof Object(callbacks).onclick === 'function') ? callbacks.onclick : null;
			notification.onclose = (typeof Object(callbacks).onclose === 'function') ? callbacks.onclose : null;
			notification.onshow  = (typeof Object(callbacks).onshow === 'function') ? callbacks.onshow : null;
			
			this.cached.push(notification);
		}
	};

	/**
	 * Remove all previous notifications
	 *
	 * @return void
	 */
	Notify.prototype.removeAll = function()
	{
		this.cached.forEach(function(notification)
		{
			notification.onclose = null;
			if (notification.close)
			{
				notification.close();
			}
			else if (notification.cancel)
			{
				notification.cancel();
			}
			else if (window.external && window.external.msIsSiteMode())
			{
				window.external.msSiteModeClearIconOverlay();
			}
		});

		this.cached = [];
	};

	// Attach the Notify function to global
	// window object
	window.Notify = new Notify();
})(this, document);