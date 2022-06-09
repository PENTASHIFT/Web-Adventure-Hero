"use strict";

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

        this.player = this._spawnPlayer();
        
        if (this.player == null)
        {
            console.log("WEB ADVENTURE HERO: Web page is too crowded!");
            throw "Web Page is too crowded.";
        }

        this.spatialh.insertObject(this.player);

        // All moving entities.
//        this.entities = new Array;
//        this.entities.push(this.player);

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

    // Rejection sampling until we find an empty spot to spawn player.
    _spawnPlayer()
    {
        // Player dimensions.
        var playerHeight = 64;
        var playerWidth = 32;
        
        // Sample space.
        var ssWidth = this.canvas.width - playerWidth;
        var ssHeight = this.canvas.height - playerHeight;

        var player = new Entity([ 0, 0, playerWidth, playerHeight ]);
        player.id = 2;

        this.spatialh.insertObject(player);

        for (let i = 0; i < 10000; i++)
        {
            var collision = false;

            // Pick random numbers.
            player.pos.x = Math.random() * ssWidth;
            player.pos.y = Math.random() * ssHeight;

            this.spatialh.updateObject(player);

            var n = this.spatialh.getNeighbors(player);
            
            if (!n[0])
                return player;
                
            for (let ii = 0; ii < n.length; ii++)
            {
                // Simple AABB.
                if ((player.pos.x < (n[ii].pos.x + n[ii].pos.width)) &&
                    ((player.pos.x + playerWidth) > n[ii].pos.x) &&
                    (player.pos.y < (n[ii].pos.y + n[ii].pos.height)) &&
                    ((player.pos.y + playerHeight) > n[ii].pos.y))
                {
                    collision = true;
                    break;
                }
            }

            if (!collision)
                return player;

        }

        return null;
    }

    updateFrame()
    {
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

    cleanUp()
    {
        document.body.removeChild(this.canvas);
    }

    // NOTE(josh): Debug Code.
    drawGridLines()
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
