//npm install @2dimensions/flare-js
//npm install gl-matrix
import Flare from '@2dimensions/flare-js/';
import {mat2d} from 'gl-matrix';

const FlareInterface = (function ()
{
	//const _ViewCenter = [0, 0];
	const _Scale = 1;
	//const _ScreenScale = 1.0;

	//const _ScreenMouse = vec2.create();
	//const _WorldMouse = vec2.create();

	/**
	 * @constructs FlareInterface
	 * 
	 * @param {Element} canvas - a canvas element object on the html page that's rendering this example.
	 * @param {onReadyCallback} ready - callback that's called after everything's been properly initialized.
	*/
	function FlareInterface(location='./',canvas, ready)
	{
		if(!location.endsWith("/"))
			location +="/"
		this.onAnimationChangeCallback = undefined;
		this.lastAnimationEnded = undefined;
		this.frameAspectRatio = 0;

		/** Build and initialize the Graphics object. */
		this._Graphics = new Flare.Graphics(canvas);
		this._Graphics.initialize(() =>
		{
			this._LastAdvanceTime = Date.now();
			this._ViewTransform = mat2d.create();
			this._AnimationInstance = null;
			this._Animation = null;
			this._SoloSkaterAnimation = null;

			const _This = this;
			
			/** Start the render loop. */
			_ScheduleAdvance(_This);
			_Advance(_This);
			/** Call-back. */
			ready(_This);
		}, location,);
	}

	/**
	 * Advance the current viewport and, if present, the AnimationInstance and Actor.
	 * 
	 * @param {Object} _This - the current viewer.
	 */
	function _Advance(_This)
	{
		//_This.setSize(window.innerWidth, window.innerHeight);

		const now = Date.now();
		const elapsed = (now - _This._LastAdvanceTime)/1000.0;
		_This._LastAdvanceTime = now;

		const actor = _This._ActorInstance;

		if(_This._AnimationInstance)
		{
			const ai = _This._AnimationInstance;
			/** Compute the new time and apply it */
			ai.time = ai.time + elapsed;
			ai.apply(_This._ActorInstance, 1.0);
		}

		if(actor)
		{
			const graphics = _This._Graphics;
		
			const w = graphics.viewportWidth;
			const h = graphics.viewportHeight;

			const vt = _This._ViewTransform;
			vt[0] = _Scale;
			vt[3] = _Scale;
			//vt[4] = (-_ViewCenter[0] * _Scale + w/2);
			//vt[5] = (-_ViewCenter[1] * _Scale + h/2);
			vt[4] = 0;
			vt[5] = 0;
			/** Advance the actor to its new time. */
			actor.advance(elapsed);
		}

		_Draw(_This, _This._Graphics);
		/** Schedule a new frame. */
		_ScheduleAdvance(_This);

		if(_This._AnimationInstance && _This._AnimationInstance.isOver && _This.lastAnimationEnded !== _This._AnimationInstance){
			_This.lastAnimationEnded = _This._AnimationInstance;
			if(_This.onAnimationChangeCallback && _This.lastAnimationEnded)
			_This.onAnimationChangeCallback(_This.lastAnimationEnded._Animation._Name,null);
		}
	}

	/**
	 * Performs the drawing operation onto the canvas.
	 * 
	 * @param {Object} viewer - the object containing the reference to the Actor that'll be drawn.
	 * @param {Object} graphics - the renderer.
	 */
	function _Draw(viewer, graphics)
	{
		if(!viewer._Actor)
		{
			return;
		}
        graphics.clear([0, 0, 0, 0]);
		graphics.setView(viewer._ViewTransform);
		viewer._ActorInstance.draw(graphics);
		graphics.flush();
	}

	/** Schedule the next frame. */
	function _ScheduleAdvance(viewer)
	{
		clearTimeout(viewer._AdvanceTimeout);
		window.requestAnimationFrame(function()
			{
				_Advance(viewer);
			}
		);
	}

	FlareInterface.prototype.onAnimationChange = function(callback)
	{
		this.onAnimationChangeCallback = callback;
	}

	/**
	 * Loads the Flare file from disk.
	 * 
	 * @param {string} url - the .flr file location.
	 * @param {onSuccessCallback} callback - the callback that's triggered upon a successful load.
	 */ 
	FlareInterface.prototype.load = function(url, callback)
	{
		const loader = new Flare.ActorLoader();
		const _This = this;
		loader.load(url, function(actor)
		{
			if(!actor || actor.error)
			{
				callback(!actor ? null : actor.error);
			}
			else
			{
				_This.setActor(actor);
				callback();
			}
		});
	};

	/**
	 * Cleans up old resources, and then initializes Actors and Animations, storing the instance references for both.
	 * This is the final step of the setup process for a Flare file.
	 */
	FlareInterface.prototype.setActor = function(actor)
	{
		/** Cleanup */
		if(this._Actor)
		{
			this._Actor.dispose(this._Graphics);
		}
		if(this._ActorInstance)
		{
			this._ActorInstance.dispose(this._Graphics);
		}
		/** Initialize all the Artboards within this Actor. */
		actor.initialize(this._Graphics);

		/** Creates new ActorArtboard instance */
		const actorInstance = actor.makeInstance();
		actorInstance.initialize(this._Graphics);
		
		this._Actor = actor;
		this._ActorInstance = actorInstance;

		if(actorInstance)
		{
			/** ActorArtboard.initialize() */
			actorInstance.initialize(this._Graphics);
			this.setAnimationByIndex(0);
		}
	};

	FlareInterface.prototype.setAnimationByName = function(animationName){
		if(!this._ActorInstance) return;
		if(this._ActorInstance._Animations.length)
		{
			/** Instantiate the Animation. */
			for(let i = 0; i < this._ActorInstance._Animations.length; i++){
				if(this._ActorInstance._Animations[i]._Name === animationName){
					this._Animation = this._ActorInstance._Animations[i];
					this.lastAnimationEnded = this._AnimationInstance;
					this._AnimationInstance = new Flare.AnimationInstance(this._Animation._Actor, this._Animation);
					this.frameAspectRatio = this._ActorInstance._Width / this._ActorInstance._Height;
					if(this.onAnimationChangeCallback && this.lastAnimationEnded)
						this.onAnimationChangeCallback(this.lastAnimationEnded._Animation._Name,animationName);
				}
			}
			
			if(!this._AnimationInstance) 
			{
				console.log("NO ANIMATION IN HERE!?"); 
				return;
			}
		}
		if(this._ActorInstance && this._ActorInstance._Width && this._ActorInstance._Height)
			this._Graphics.setSize(this._ActorInstance._Width,this._ActorInstance._Height);
	};

	FlareInterface.prototype.setAnimationByIndex = function(animationIndex){
		if(!this._ActorInstance) return;
		if(this._ActorInstance._Animations.length)
		{
			/** Instantiate the Animation. */
			this._Animation = this._ActorInstance._Animations[animationIndex];
			
			this.lastAnimationEnded = this._AnimationInstance;
			this._AnimationInstance = new Flare.AnimationInstance(this._Animation._Actor, this._Animation);
			this.frameAspectRatio = this._ActorInstance._Width / this._ActorInstance._Height;
			if(this.onAnimationChangeCallback && this.lastAnimationEnded)
				this.onAnimationChangeCallback(this.lastAnimationEnded._Animation._Name,animationName);

			if(!this._AnimationInstance) 
			{
				console.log("NO ANIMATION IN HERE!?"); 
				return;
			}

		}
		if(this._ActorInstance && this._ActorInstance._Width && this._ActorInstance._Height)
			this._Graphics.setSize(this._ActorInstance._Width,this._ActorInstance._Height);
	};
	FlareInterface.prototype.getFrameAspectRatio = function(){
		return this.frameAspectRatio;
	};
	/*FlareInterface.prototype.getCenter = function(){
		return this._ViewCenter;
	};

	FlareInterface.prototype.setCenter = function(x,y){
		this._ViewCenter = [x,y];
	};*/

	/** Set the renderer's viewport to the desired width/height. */
	/*FlareInterface.prototype.setSize = function(width, height)
	{
		this._Graphics.setSize(width, height);
	};*/

	return FlareInterface;
}());

export default FlareInterface;