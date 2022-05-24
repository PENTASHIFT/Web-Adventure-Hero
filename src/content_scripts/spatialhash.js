"use strict";

class SpatialHash
{
    constructor(dim) 
    {
        let [width, height] = dim;      // Dimensions of window.
        this.cellSize = 6;      // Divison/Multiplication by 64 via bitshift.

        // NOTE(josh): Don't know if incrementing no matter what is the play
        //              here.
        this.cellWidth = (width >> this.cellSize) + 1;        // Floor division.
        this.cellHeight = (height >> this.cellSize) + 1;      // Floor division.

        // NOTE(josh): May be worth flattening this with length cellWidth * cellHeight.
        this.cells = Array.from(Array(this.cellWidth), () =>
            Array.from(Array(this.cellHeight), () => new Array));
    }

    _getCellIndex(pos)
    {
        // Normalize pixel position to cell position.
        var x = pos[0] >> this.cellSize;
        var y = pos[1] >> this.cellSize;

        // Sanity checks.
        if (x < 0)
            x = 0;
        else if (x > this.cellWidth)
            x = this.cellWidth - 1;

        if (y < 0)
            y = 0;
        else if (y > this.cellHeight)
            y = this.cellHeight - 1;

        return [x, y];
    }

    insertObject(obj)
    {
        // See entity.js for obj definition.
        var min = this._getCellIndex([obj.pos.x, obj.pos.y]);
        var max = this._getCellIndex(
            [(obj.pos.x + obj.pos.width), (obj.pos.y + obj.pos.height)]
        );

        obj.sh = [min, max];
        
        for (let xmin = min[0], xmax = max[0]; xmin <= xmax; xmin++) 
        {
            for (let ymin = min[1], ymax = max[1]; ymin <= ymax; ymin++)
            {
                this.cells[xmin][ymin].push(obj);
            }
        }
    }

    // NOTE(josh): This is actually only deleting the reference. Maybe rename?
    deleteObject(obj)
    {
        var [min, max] = obj.sh;

        for (let xmin = min[0], xmax = max[0]; xmin <= xmax; xmin++)
        {
            for (let ymin = min[1], ymax = max[1]; ymin <= ymax; ymin++)
            {
                var len = this.cells[xmin][ymin].length
                for (let i = 0; i < len; i++)
                {
                    if (obj.id == this.cells[xmin][ymin][i].id)
                    {
                        // Swap, delete, and break here.
                        let temp = this.cells[xmin][ymin][len - 1];
                        this.cells[xmin][ymin][len - 1] =
                            this.cells[xmin][ymin][i];
                        this.cells[xmin][ymin][i] = temp;
                        this.cells[xmin][ymin].pop();
                        break;
                    }
                }
            }
        }
    }

    updateObject(obj)
    {
        var [min, max] = obj.sh;
        var newMin = this._getCellIndex([obj.pos.x, obj.pos.y]);
        var newMax = this._getCellIndex(
            [(obj.pos.x + obj.pos.width), (obj.pos.y + obj.pos.height)]
        );
        
        // If obj has not moved into a new cell, do nothing.
        if ((min[0] == newMin[0]) &&
                (min[1] == newMin[1]) &&
                (max[0] == newMax[0]) &&
                (max[1] == newMax[1]))
            return;

        this.deleteObject(obj);
        this.insertObject(obj);
    }

    _neighbors(xmin, xmax, ymin, ymax, id)
    {
        // Hoisting this loop up into it's own method.
        var n = new Array;

        for (let xi = xmin; xi <= xmax; xi++)
        {
            for (let yi = ymin; yi <= ymax; yi++)
            {
                for (let i = 0; i < this.cells[xi][yi].length; i++)
                {
                    if (id != this.cells[xi][yi][i].id)
                        n.push(this.cells[xi][yi][i]);
                }
            }
        }

        return n;
    }

    getNeighbors(obj)
    {
        // Return an array of entitie(s) existing in the same cells as obj.
        var [min, max] = obj.sh;
        return this._neighbors(min[0], max[0], min[1], max[1], obj.id);
    }

    getNeighborsInRange(obj)
    {
        //  Return an array of entitie(s) existing in the same cells as obj,
        //  where obj + del will be, and every step along the way.
        var [min, max] = obj.sh;
        var neighbors;
        var newMin = this._getCellIndex([ 
            obj.pos.x + obj.del.x, 
            obj.pos.y + obj.del.y 
        ]);
        var newMax = this._getCellIndex([
            obj.pos.x + obj.pos.width + obj.del.x,
            obj.pos.y + obj.pos.height + obj.del.y
        ]);

        if ((min != newMin) || (max != newMax))
        {
            // Get entities within rectangular range of cells encompassing
            //      starting pos and projected ending pos.

            // NOTE(josh): Bruteforcing like this is suboptimal way of handling
            //              this; however, this works no matter size or speed of
            //              the entity.
            //              While suboptimal, for most use cases the difference
            //              won't be substantial. If performance becomes an
            //              issue, use a ray approach.
            
            var xStart, xEnd;
            var yStart, yEnd;

            if (obj.del.x < 0)
            {
                xStart = newMin[0];
                xEnd = max[0];
            }
            else
            {
                xStart = min[0];
                xEnd = newMax[0];
            }

            if (obj.del.y < 0)
            {
                yStart = newMin[1];
                yEnd = max[1];
            }
            else
            {
                yStart = min[1];
                yEnd = newMax[1];
            }

            neighbors = this._neighbors(xStart, xEnd, yStart, yEnd, obj.id);
        }
        else
        {
            neighbors = this.getNeighbors(obj);
        }

        return neighbors;

    }
}
