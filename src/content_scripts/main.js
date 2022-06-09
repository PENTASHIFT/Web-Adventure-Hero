"use strict";

var sh = null;
var msvips = null;
var game = null;

var debug = false;

const moveSpeed = 3;

function keyUp(key)
{
    switch (key.keyCode)
    {
        case 68:    // D key
        {
            // If we're moving the opposite direction already, don't interrupt.
            if (game.player.del.x == -moveSpeed)
            {
                return;
            }

            else
            {
                if (!isState(game.player.state, STATES.falling))
                {
                    game.player.state = stateUpdate(game.player.state,
                        STATES.standing);
                }

                game.player.del.x = 0;
            }
        } break;

        case 65:    // A key
        {
            // If we're moving the opposite direction already, don't interrupt.
            if (game.player.del.x == moveSpeed)
            {
                return;
            }

            else
            {
                if (!isState(game.player.state, STATES.falling))
                {
                    game.player.state = stateUpdate(game.player.state,
                        STATES.standing);
                }

                game.player.del.x = 0;
            }
        } break;

        case 81:    // Q key
        {
            debug = false;
        } break;
    }
}

function keyPress(key)
{
    switch (key.keyCode)
    {
        case 68:    // D key
        {
            if (!isState(game.player.state, STATES.sign))
            {
                game.player.state = stateUpdate(game.player.state, STATES.sign);
            }

            if (!isState(game.player.state, STATES.falling))
            {
                    game.player.state = stateUpdate(game.player.state,
                        STATES.running);
            }

            game.player.del.x = moveSpeed;
        } break;

        case 65:    // A key
        {
            if (isState(game.player.state, STATES.sign))
            {
                game.player.state = stateUpdate(game.player.state, STATES.sign);
            }

            if (!isState(game.player.state, STATES.falling))
            {
                    game.player.state = stateUpdate(game.player.state,
                        STATES.running);
            }

            game.player.del.x = -moveSpeed;
        } break;
        
        case 87:    // W key
        {
            game.player.state = stateUpdate(game.player.state, STATES.jumping);
            game.player.state = stateUpdate(game.player.state, STATES.hasJumped);
        } break;

        case 81:    // Q key
        {
            debug = true;
        } break;
    }
}

// Main gameplay loop.
function loop()
{
    // TODO(josh): Add pause check.
    game.updateFrame();
    game.drawPlayer();
    
    if (debug)
        game.drawGridLines();

    requestAnimationFrame(loop);
}

function toggle()
{
    if (game != null)
    {
        // Turn off.
        game.cleanUp();
        window.removeEventListener("keyup", keyUp);
        window.removeEventListener("keydown", keyPress);
        sh = null;
        msvips = null;
        game = null;
    }
    else
    {
        // Turn on.
        var canvasDim = { width: 0, height: 0 };

        {
            let scrollBarDim = 
            {
                width: (window.innerWidth - document.documentElement.clientWidth),
                height: (window.innerHeight - document.documentElement.clientHeight)
            };

            canvasDim.width = (window.innerWidth - scrollBarDim.width);
            canvasDim.height = (window.innerHeight - scrollBarDim.height);
        };

        sh = new SpatialHash(canvasDim);
        msvips = new MSVIPS(document.body, canvasDim, sh);
        game = new Game(canvasDim, sh);

        window.addEventListener("keyup", keyUp);
        window.addEventListener("keydown", keyPress);

        loop();
    }
}
