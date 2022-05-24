"use strict";

class Game
{
    constructor()
    {
        // Create the canvas.
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // See util/spatialhash.js
        this.spatialh = new SpatialHash([
            this.canvas.width, 
            this.canvas.height
        ]);

        // See entity.js
        this.player = new Entity([
            this.canvas.width >> 1, 
            this.canvas.height >> 1, 
            32, 64
        ]);

        // Game attributes
        this.gravity = 3;

        this.player.del.y = this.gravity;

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
        this.canvas.style.width = window.innerWidth + "px";
        this.canvas.style.height = window.innerHeight + "px";
        this.canvas.style.zIndex = "250000";
        this.canvas.style.backgroundColor = "#ffffff00";

        this.canvas.focus();

    }

    // TODO(josh): This is going to be updating game logic/entities. Maybe
    //              choose a name that reflects that?
    updateFrame()
    {
        entityMove(this.player, this.spatialh);
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

    cleanUp()
    {
        document.body.removeChild(this.canvas);
    }
}
