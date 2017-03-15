	var play_step_sound = function() { play_sound('step'); };

	function play_sound(name) {
		if(!$('#sound_on').is(':checked')) return;
		var audio_elem = document.getElementById('sound_' + name);
		audio_elem.pause();
		audio_elem.load();
		audio_elem.play();
	}
	  

