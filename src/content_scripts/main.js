"use strict";

// TODO(josh): Figure out a more proper place to put keyUp & keyDown functions
//              and stop littering main.js.

// TODO(josh): Remove space key in favor of W key so there isn't any conflict
//              with default browser key-bindings.

// TODO(josh): Find entry point for both player and entities so they can spawn
//              correctly.

// TODO(josh): Go through all the code and make sure it's stylistically consistant.

const moveSpeed = 3;

function keyUp(key)
{
    switch(key.keyCode)
    {
        case 68:    // D key
        {
            if (game.player.del.x == -moveSpeed)
            {
                return;
            }

            else
            {
                game.player.del.x = 0;
            }
        } break;

        case 65:    // A key
        {
            if (game.player.del.x == moveSpeed)
            {
                return;
            }

            else
            {
                game.player.del.x = 0;
            }
        } break;

    }
}

function keyPress(key)
{
    switch(key.keyCode)
    {
        case 68:    // D key
        {
            //console.log("D");
            game.player.del.x = moveSpeed;
        } break;

        case 65:    // A key
        {
            //console.log("A");
            game.player.del.x = -moveSpeed;
        } break;
        

        case 87:    // W key
        {
            game.player.state = stateUpdate(game.player.state, STATES.jumping);
            game.player.state = stateUpdate(game.player.state, STATES.hasJumped);
        } break;

        // NOTE(josh): Debug code.
        default: {
            console.log(key.keyCode);
        } break;
    }
}

var sh = null;
var msvips = null;
var game = null;

// Main gameplay loop.
function _loop()
{
    // TODO(josh): Add pause check.
    game.updateFrame();
    game.drawPlayer();
    game._drawGridLines();
    requestAnimationFrame(_loop);
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
        }

        sh = new SpatialHash(canvasDim);
        msvips = new MSVIPS(document.body, canvasDim, sh);
        game = new Game(canvasDim, sh);

        window.addEventListener("keyup", keyUp);
        window.addEventListener("keydown", keyPress);

        _loop();
    }
}
