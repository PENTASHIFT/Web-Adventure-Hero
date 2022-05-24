"use strict";

// NOTE(josh): Probably do hit-boxes for more granularity with collision.
//              Pixel-perfect collision would probably be overkill.

// NOTE(josh): There is something very wrong with the spatialhash. There seems
//              to be an extra cell of padding per edge.

// TODO(josh): Figure out a more proper place to put keyUp & keyDown functions
//              and stop littering main.js.

function keyUp(key)
{
    switch(key.keyCode)
    {
        case 68:    // D key
        case 65:    // A key
        {
            game.player.del.x = 0;
        } break;

        // NOTE(josh): Debug
        case 87:    // W key
        case 83:    // S key
        {
            game.player.del.y = 0;
        } break;
    }
}

function keyPress(key)
{
    const moveSpeed = 3;
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
        

        case 32:    // Space
        {
            if (game.player.state != entityStates.jumping)
            {
                console.log("SPACE");
                game.player.del.y = -moveSpeed;
                game.player.state = entityStates.jumping;
            }
        } break;

        // NOTE(josh): Debug
        case 87:    // W key
        {
            //console.log("W");
            game.player.del.y = -moveSpeed;
        } break;

        case 83:    // S key
        {
            //console.log("S");
            game.player.del.y = moveSpeed;
        } break;

        default: {
            console.log(key.keyCode);
        } break;
    }
}

var game = null;

// Main gameplay loop.
function _loop()
{
    // TODO(josh): Add pause functionality.
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
        game = null;
    }
    else
    {
        // Turn on.
        game = new Game;
        VIPS(document.body, game.spatialh)
        window.addEventListener("keyup", keyUp);
        window.addEventListener("keydown", keyPress);
        _loop();
    }
}
