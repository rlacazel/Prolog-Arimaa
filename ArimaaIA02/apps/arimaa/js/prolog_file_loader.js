/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

debugging = true;
var output_console = null;
//load_state();
//initialize();

var stdout_buffer;
var query;
var arimaa = ARIMAA_MAIN;
var pengine = null;
	
function onload()
{
    output_console = document.getElementById('stdout');    
    stdout_buffer = document.createElement('div');
    stdout_buffer.innerHTML = "";
    output_console.appendChild(stdout_buffer);     
}

function failed()
{
	var solution = JSON.stringify(this.data);
	alert("Invalid prolog query: " + solution);
}

function execute(query)
{
	if (pengine == null)
	{
		pengine = new Pengine({
			  application: 'arimaa',
			  ask: query,
			  onsuccess: bot_response,
			  onfailure: failed,
			  onerror:   failed
		  });
	}
	else
	{
		pengine.ask(query);
	}
}

function predicate_flush_stdout()
{	
    if (stdout_buffer.innerHTML != "")
        stdout("\n");
    return true;
}

function bot_response()
{
	pengine.destroy();
	pengine = null;
	for (var key in this.data) 
	{
		if (this.data[key].hasOwnProperty("Moves"))
		{		
			output_console.scrollTop = 10;
			arimaa.bot_move_get_answer_from_prolog(this.data[key]);
		}
	}
}
