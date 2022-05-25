"use strict";

const entityStates = 
{
    standing: 0,
    jumping: 1,
    attacking: 2
};

// NOTE(josh): Reconsider this being a class rather than a pseudo-struct.
class Entity
{
    constructor(pos)
    {
        this.sh = null;         // See utils/spatialhash.js
        this.id = -1;
        this.hitBoxes = null;   // See utils/hitbox.js
        this.state = null;

        // Bounding box.
        this.pos = { x: pos[0], y: pos[1], width: pos[2], height: pos[3] };
        this.del = { x: 0, y: 0 };
    }
}

// NOTE(josh): Does this make sense to have this here?
function _entityCollision(entity, neighbor)
{
    // Swept AABB.
    var normalX = 0;
    var normalY = 0;
    var exitTime = 0;
    var entryTime = 1.0; 
    var xEntry, xExit, xInvEntry, xInvExit;
    var yEntry, yExit, yInvEntry, yInvExit;
    
    if (entity.del.y > 0)
    {
        // Check neighbor.pos.y
        /*
                  Entity
                    |
                    v
            +---------------+
            |               |
            |               |
            +---------------+
        */
        yInvEntry = neighbor.pos.y - (entity.pos.y + entity.pos.height);
        yInvExit = (neighbor.pos.y + neighbor.pos.height) - entity.pos.y;
    }
    else
    {
        // Check neighbor.pos.y + neighbor.pos.height
        /*  
            +---------------+
            |               |
            |               |
            +---------------+
                    ^
                    |
                  Entity
        */
        yInvEntry = (neighbor.pos.y + neighbor.pos.height) - entity.pos.y;
        yInvExit = neighbor.pos.y - (entity.pos.y + entity.pos.height);
    }

    if (entity.del.x > 0)
    {
        // Check neighbor.pos.x
        /*
                     +------+
                     |      |
                     |      |
           Entity -> |      |
                     |      |
                     +------+ 
        */
        xInvEntry = neighbor.pos.x - (entity.pos.x + entity.pos.width);
        xInvExit = (neighbor.pos.x + neighbor.pos.width) - entity.pos.x;
    }
    else
    {
        // Check neighbor.pos.x + neighbor.pos.width
        /* 
           +------+
           |      |
           |      |
           |      | <- Entity
           |      |
           +------+ 
        */
        xInvEntry = (neighbor.pos.x + neighbor.pos.width) - entity.pos.x;
        xInvExit = neighbor.pos.x - (entity.pos.x + entity.pos.width);
    }

    xEntry = xInvEntry / entity.del.x;
    xExit = xInvExit / entity.del.x;

    yEntry = yInvEntry / entity.del.y;
    yExit = yInvExit / entity.del.y;

    if (entity.del.x == 0)
    {
        xEntry = -Infinity;
        xExit = Infinity;
    }
    
    if (entity.del.y == 0)
    {
        yEntry = -Infinity;
        yExit = Infinity;
    }
    
    entryTime = (xEntry > yEntry) ? xEntry : yEntry;    // Max
    exitTime = (xExit > yExit) ? yExit : xExit;         // Min

    // No collision found.
    if ((xEntry > 1) ||
        (yEntry > 1) ||
        (entryTime > exitTime) ||
        (xEntry < 0 && yEntry < 0))
    {
        return [1.0, [normalX, normalY]];
    }

    if (xEntry > yEntry)
    {
        if (xInvEntry < 0)
        {
            normalX = 1;
            normalY = 0;
        }
        else
        {
            normalX = -1;
            normalY = 0;
        }
    }
    else
    {
        if (yInvEntry < 0)
        {
            normalX = 0;
            normalY = 1;
        }
        else
        {
            normalX = 0;
            normalY = -1;
        }
    }

    return [entryTime, [normalX, normalY]];
} 

function entityMove(entity, spatialh)
{
    if (entity.del.y == 0 && entity.del.x == 0)
    {
        // TODO(josh): I don't like having to reassign gravity everytime. 
        //              Brainstorm an alternative.
        entity.del.y = 3;   // Reset gravity.
        return;
    }

    var normalX = 0;
    var normalY = 0;
    var collisionTime = 1.0;
    var neighbors = spatialh.getNeighborsInRange(entity);

    for (let i = 0; i < neighbors.length; i++)
    {
        // If neighbor is not a platform.
        // NOTE(josh): May want to check regardless of if it's a platform. 
        if (neighbors[i].id != -1)
            continue;

        var [c, n] = _entityCollision(entity, neighbors[i]);

        if (c < collisionTime)
        {
            collisionTime = c;
            [normalX, normalY] = n;
        }
    }

    entity.pos.x += entity.del.x * collisionTime;
    entity.pos.y += entity.del.y * collisionTime;
    
    spatialh.updateObject(entity);

    // Push response to collision.
    if (collisionTime < 1.0)
    {
        var remainingTime = 1.0 - collisionTime;
        var magnitude = Math.sqrt((entity.del.x * entity.del.x + 
            entity.del.y * entity.del.y)) * remainingTime;
        var dotprod = entity.del.x * normalY + entity.del.y * normalX;

        if (dotprod > 0) dotprod = 1;
        else if (dotprod < 0) dotprod = -1;

        entity.del.x = dotprod * normalY * magnitude;
        entity.del.y = dotprod * normalX * magnitude;

        entityMove(entity, spatialh);
    }
}
