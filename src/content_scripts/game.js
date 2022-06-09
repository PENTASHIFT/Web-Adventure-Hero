"use strict";

// TODO(josh): Account for window changing size.

class Game
{
    constructor(dim, sh)
    {
        // Create the canvas.
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = dim.width;
        this.canvas.height = dim.height;
        
        // See util/spatialhash.js
        this.spatialh = sh;

        // Add boundaries to edge of screen.
        // Ceiling.
        this.spatialh.insertObject(
            new Entity([ 0, 0, this.canvas.width, 1 ])
        );
        // Floor
        this.spatialh.insertObject(
            new Entity([ 0, this.canvas.height - 1, this.canvas.width, 1 ])
        );
        // Left Wall
        this.spatialh.insertObject(
            new Entity([ 0, 0, 1, this.canvas.height ])
        );
        // Right Wall
        this.spatialh.insertObject(
            new Entity([ this.canvas.width - 1, 0, 1, this.canvas.height ])
        );

        // See entity.js
        this.player = new Entity([
            this.canvas.width >> 1, 
            this.canvas.height >> 1, 
            32, 64
        ], 0, this.gravity);

        // All moving entities.
        this.entities = new Array;
        this.entities.push(this.player);

        // NOTE(josh): This needs to standardized for all objects.
        this.player.id = 2;

        this.spatialh.insertObject(this.player);
        
        document.body.appendChild(this.canvas);

        // Canvas attributes.
        this.canvas.id = "Web Adventure";
        this.canvas.style.top = "0px";
        this.canvas.style.left = "0px";
        this.canvas.style.position = "fixed";
        this.canvas.style.width = this.canvas.width + "px";
        this.canvas.style.height = this.canvas.height + "px";
        this.canvas.style.zIndex = "250000";                // Top-most layer.
        this.canvas.style.backgroundColor = "#ffffff00";    // Transparent.

        this.canvas.focus();

    }

    // TODO(josh): This is going to be updating game logic/entities. Maybe
    //              choose a name that reflects that?
    updateFrame()
    {
        // console.log(this.player.state & 0xFFC00);
        entityUpdateVel(this.player);
        entityMove(this.player, this.spatialh, this.player.del.x,
            this.player.del.y);
        this.player.state = stateIncrement(this.player.state);
    }

    drawPlayer()
    {
        //this.ctx.strokeStyle = "#ffffff";     // Dark mode.
        this.ctx.strokeStyle = "#000000";       // Light mode.

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeRect(
            this.player.pos.x, 
            this.player.pos.y,
            this.player.pos.width,
            this.player.pos.height
        );
    }

    // TODO(josh): Try moving all cleanup code into this one call.
    cleanUp()
    {
        document.body.removeChild(this.canvas);
    }

    // NOTE(josh): Debug Code.
    _drawGridLines()
    {
        for (let i = 0, p = 0; i < this.spatialh.cellWidth; i++, p += 64)
        {
            for (let ii = 0, pp = 0; ii < this.spatialh.cellHeight; ii++, pp += 64)
            {
                if (this.spatialh.cells[i][ii][0])
                {
                    this.ctx.strokeStyle = "#00ffff";
                    this.ctx.strokeRect(p, pp, 64, 64);
                }
                else
                {
                    this.ctx.strokeStyle = "#ff00ff";
                    this.ctx.strokeRect(p, pp, 64, 64);
                }
            }
        }
    }
}
