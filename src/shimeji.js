/** Library for loading shinmeji **/
var Shimeji = (function(){
	var Shimeji = function(config){
		this.config = config;
		this.actionQueue = [];
		this.environment = [];
		this.behaviors = {};
		this.container = null;
		this.image = null;
		this._timeout = -1;
		this._x = null;
		this._y = null;
	};
	Shimeji.prototype.init = function(element, x, y){
		if(!element) { throw "Invalid bind element"; }
		var image = document.createElement("img");
		element.appendChild(image);
		this.container = element;
		this.image = image;
		this._x = (typeof x === "number") ? x : this.container.offsetLeft;
		this._y = (typeof y === "number") ? y :this.container.offsetTop;
		
		this.place(this._x, this._y);
	};
	Shimeji.prototype.makeEnvironment = function(elems){
		this.environment.push({
			"name":"page",
			"top":0,
			"left":0,
			"bottom":window.innerHeight,
			"right":window.innerWidth
		})
		if(typeof elems === "undefined"){ return; }
		for(var i = 0; i < elems.length; i++){
			var elem = elems[i];
			this.environment.push({
				"name": (elem.id !== "" ? elem.id : "elem_" + i),
				"top": elem.offsetTop,
				"bottom": elem.offsetTop + elem.offsetHeight,
				"left": elem.offsetLeft,
				"right": elem.offsetLeft + elem.offsetWidth
			});
		};
	};
	Shimeji.prototype._inEnv = function(env, x, y){
		return x < env.right && x > env.left && y > env.top && y < env.bottom;
	};
	Shimeji.prototype.place = function(x, y){
		this._x = x;
		this._y = y;
		this.container.style.left = this._x + "px";
		this.container.style.top = this._y + "px";
	};
	Shimeji.prototype.cancelAct = function(){
		this.actionQueue = [];
	};
	Shimeji.prototype.interact = function(oX, oY){
		// Interact with the environment
		for(var i = 0; i < this.environment.length; i++){
			var env = this.environment[i];
			if(this._inEnv(env, this._x, this._y) !== this._inEnv(env, oX, oY)){
				var interact = [];
				if(this._inEnv(env, oX, oY)){
					interact.push("exit");
					if(this._y >= env.bottom && oY < env.bottom){
						interact.push("bottom");
					}else if(this._y <= env.top && oY > env.top){
						interact.push("top");
					}
					if(this._x >= env.right && oX < env.right){
						interact.push("right");
					}else if(this._x <= env.left && oX > env.left){
						interact.push("left");
					}
				}else{
					interact.push("enter");
					if(this._y <= env.bottom && oY > env.bottom){
						interact.push("bottom");
					}else if(this._y >= env.top && oY < env.top){
						interact.push("top");
					}
					if(this._x <= env.right && oX > env.right){
						interact.push("right");
					}else if(this._x >= env.left && oX < env.left){
						interact.push("left");
					}
				}
				var ikey = interact.join("_");
				if(typeof this.behaviors[env.name] === "function"){
					this.behaviors[env.name](ikey, env);
				}else if(this.behaviors[env.name] && this.behaviors[env.name][ikey]){
					if(typeof this.behaviors[env.name][ikey] !== "function"){
						this.actionQueue = [];
						this.act(this.behaviors[env.name][ikey]);
						return;
					}else{
						this.behaviors[env.name][ikey](env);
					}
				}
			}
		}
	};
	Shimeji.prototype.pose = function(posture){
		this.image.src = (this.config.baseUrl ? this.config.baseUrl : "") + posture.src;
		this.image.style.left = -posture.anchor[0] + "px";
		this.image.style.top = -posture.anchor[1] + "px";

		this.image.className = (posture.reverseVert ? "reverseV" : "") + " " + (posture.reverseHori ? "reverseH" : "");
		var oX = this._x, oY = this._y;
		this._x += (posture.reverseHori ? -1: 1) * posture.move.x;
		this._y += (posture.reverseVert ? -1: 1) * posture.move.y;
		this.interact(oX, oY);
		
		this.container.style.transition = "top " + posture.duration + "ms, left " + posture.duration + "ms linear";
		this.place(this._x, this._y);
	};
	Shimeji.prototype.act = function(action, repeat, reverseH, reverseV, onEnd){
		if(typeof repeat !== "number"){
			repeat = 1;
		}
		if(this.config.actions[action]){
			if(!reverseV && !reverseH){
				for(var r = 0; r < repeat; r++){
					for(var i = 0; i < this.config.actions[action].length; i++){
						this.actionQueue.push(this.config.actions[action][i]);
					};
				}
			}else{
				for(var r = 0; r < repeat; r++){
					for(var i = this.config.actions[action].length - 1; i >= 0; i--){
						var revact = {};
						for(var prop in this.config.actions[action][i]){
							if(this.config.actions[action][i].hasOwnProperty(prop)){
								revact[prop] = this.config.actions[action][i][prop];
							}
						}
						revact["reverseVert"] = reverseV;
						revact["reverseHori"] = reverseH;
						this.actionQueue.push(revact);
					};
				}
			}
			if(typeof onEnd === "function"){
				this.actionQueue.push(onEnd);
			}
			if(this._timeout < 0){
				var self = this;
				var _cb = function(){
					if(self.actionQueue.length > 0){
						var posture = self.actionQueue.shift();
						if(typeof posture === "function"){
							posture();
							_cb();
							return;
						}
						self.pose(posture);
						self._timeout = setTimeout(_cb, posture.duration );
					}else{
						self._timeout = -1;
					}
				};
				_cb();
			}
		}
	};
	Shimeji.prototype.behavior = function(trigger, action, hook){
		if(typeof hook === "undefined"){
			this.behaviors[trigger] = action;
		}else{
			if(!this.behaviors[trigger]){
				this.behaviors[trigger] = {};
			}
			this.behaviors[trigger][hook] = action;
		}
	};
	return Shimeji;
})();
