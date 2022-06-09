"use strict";

// NOTE(josh): Reconsider this being a class rather than a pseudo-struct.
class Entity
{
    constructor(pos, delX=0, delY=0)
    {
        this.sh = null;         // See utils/spatialhash.js
        this.id = -1;
        this.hitBoxes = null;   // See utils/hitbox.js

        this.state = STATES.falling;

        // Bounding box.
        this.pos = { x: pos[0], y: pos[1], width: pos[2], height: pos[3] };
        this.del = { x: delX, y: delY };

        // TODO(josh): This needs to be set for boundary boxes and character
        //              for dynamic coloring based upon background, etc.
        this.color = null;
    }
}

// NOTE(josh): Does this make sense to have this here?
function _entityCollision(entity, neighbor, delX, delY)
{
    // Swept AABB.
    var normalX = 0;
    var normalY = 0;
    var exitTime = 0;
    var entryTime = 1.0; 
    var xEntry, xExit, xInvEntry, xInvExit;
    var yEntry, yExit, yInvEntry, yInvExit;
    
    if (delY > 0)
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

    if (delX > 0)
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

    xEntry = xInvEntry / delX;
    xExit = xInvExit / delX;

    yEntry = yInvEntry / delY;
    yExit = yInvExit / delY;

    if (delX == 0)
    {
        xEntry = -Infinity;
        xExit = Infinity;
    }
    
    if (delY == 0)
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

function entityMove(entity, spatialh, delX, delY)
{
    // Sanity check.
    if (delY == 0 && delX == 0)
    {
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

        var [c, n] = _entityCollision(entity, neighbors[i], delX, delY);

        if (c < collisionTime)
        {
            collisionTime = c;
            [normalX, normalY] = n;
        }
    }

    entity.pos.x += (delX * collisionTime);
    entity.pos.y += (delY * collisionTime);
    
    spatialh.updateObject(entity);

    if (normalY == -1)
    {
        if (delX != 0)
        {
            entity.state = stateUpdate(entity.state, STATES.running);
        }
        else
        {
            entity.state = stateUpdate(entity.state, STATES.standing);
        }
    }

    // Push response to collision.
    if (collisionTime < 1.0)
    {
        var remainingTime = 1.0 - collisionTime;
        var magnitude = Math.sqrt((delX * delX + 
            delY * delY)) * remainingTime;
        var dotprod = delX * normalY + delY * normalX;
        var newDelX, newDelY;

        if (dotprod > 0) dotprod = 1;
        else if (dotprod < 0) dotprod = -1;

        newDelX = dotprod * normalY * magnitude;
        newDelY = dotprod * normalX * magnitude;
        
        // If mid-jumping and hit the bottom of a platform.
        if (normalY == 1)
        {
            entity.state = stateUpdate(entity.state, STATES.falling);
            newDelY = -newDelY;
        }

        entityMove(entity, spatialh, newDelX, newDelY);
    }
}

function entityUpdateVel(entity)
{
    if (isState(entity.state, STATES.jumping))
    {
        var cnt = stateCount(entity.state, STATES.jumping);

        // Derivative of parabola -0.3472x^2 + 8.333x.
        // Negated because the origin is in the top left corner of the canvas.
        var delY = -((cnt * -0.6944) + 8.333);
        if (delY > 0)
        {
            entity.state = stateUpdate(entity.state, STATES.falling);
        }

        entity.del.y = delY;
    }
    else if (isState(entity.state, STATES.falling))
    {
        // NOTE(josh): Kind of weird to immediately go to 3 but, it should be fine?
        entity.del.y = 3;
    }
}
