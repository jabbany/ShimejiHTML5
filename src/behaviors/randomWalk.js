/**
 * Randomly invoke some actions according to a CTMC
 */

function randomWalk ( shimeji , markovProbs , exitFunc ) {
	var _rw = function(){
		// Pick random element
		var transition = Math.random();
		var _r = 0;
		for(var i = 0; i < markovProbs["_states"].length; i++){
			var state = markovProbs["_states"][i];
			if(_r <= transition && _r + markovProbs[state].prob >= transition){
				// Enter state
				console.log("Enter " + state + " N:" + markovProbs[state].name);
				if(!markovProbs[state].isExit){
					shimeji.act(markovProbs[state].name, 
						(markovProbs[state].repeat ? markovProbs[state].repeat : 1), 
						markovProbs[state].revH, 
						markovProbs[state].revV, 
						markovProbs[state].revM, 
						_rw);
					return;
				}else{
					if(typeof exitFunc === "function"){
						exitFunc();
					}
					return;
				}
			};
			_r += markovProbs[state].prob;
		};
		if(typeof exitFunc === "function"){
			exitFunc();
		}
		return;
	}
	_rw();
};
