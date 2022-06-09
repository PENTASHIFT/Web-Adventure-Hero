"use strict";

/* Welcome to unnecessary but fun bitwise-hell. */

/* 
    Bit flag & counter for states and their frame count.
    29th bit:
        1 = Right-facing.
        0 = Left-facing.
    28th bit:
        1 = Has Jumped.
    27th bit:
        1 = Dying
    26th bit:
        1 = Taking Damage.
    25th bit:
        1 = Grappling Hook
    24th bit:
        1 = Attacking
    23th bit: 
        1 = Falling
    22th bit:
        1 = Jumping
    21th bit:
        1 = Running
    20th bit:
        1 = Standing
    10th-19th bits: Frame counter for standing, running, jumping, etc.
    0th-9th bits: Frame counter for attack, grappling hook, and dying.
*/
const STATES = 
{
    standing: (1 << 20),
    running: (1 << 21),
    jumping: (1 << 22),
    falling: (1 << 23),

    // NOTE(josh): This can be mixed with the states above but not each other.
    attacking: (1 << 24),
    hurt: (1 << 25),

    // NOTE(josh): Not these.
    grapplingHook: (1 << 26),
    dying: (1 << 27),

    hasJumped: (1 << 28),
    sign: (1 << 29),
};

function stateCount(entityState, state)
{
    if ((state & 0xF00000) > 0)
    {
        return ((entityState & 0xFFC00) >> 10);
    }
    else if ((state & 0x3000000) > 0)
    {
        return (entityState & 0x3FF);
    }
    else
    {
        return 0;
    }
}

function isState(entityState, state)
{
    return ((entityState & state) > 0) ? true : false;
}

// Overly convoluted FSM.
function stateUpdate(entityState, state)
{
    // TODO(josh): What if dead in mid-air???
    if (state == STATES.dying)
    {
        // Clear all states except sign then set dying state.
        return ((entityState & STATES.sign) | STATES.dying);
    }

    if (state == STATES.sign)
    {
        return (entityState ^= STATES.sign);
    }

    if ((state == STATES.jumping) && ((entityState & STATES.hasJumped) > 0))
    {
        // No (n > 1) jumps allowed.
        return entityState;
    }

    if (((entityState & STATES.hasJumped) > 0) &&
        ((state == STATES.standing) ||
        (state == STATES.running)))
    {
        // Reset hasJumped.
        entityState &= ~(STATES.hasJumped);
    }

    if (state == STATES.hasJumped)
    {
        if ((entityState & STATES.hasJumped) == 0)
            return (entityState |= state);
        else
            return entityState;
    }

    switch ((entityState & 0xF00000))
    {
        case STATES.standing:
        {
            if ((state != STATES.standing) &&
                (state != STATES.jumping))
            {
                entityState ^= STATES.standing;  // Toggle standing off.
                entityState |= state;
                entityState &= ~(0xFFC00);        // Clear iterating bits.
            }
        } break;

        case STATES.running:
        {
            if ((state != STATES.running) &&
                (state != STATES.jumping))
            {
                entityState ^= STATES.running;
                entityState |= state;
                entityState &= ~(0xFFC00);
            }
        } break;

        case STATES.jumping:
        {
            if ((state == STATES.falling) || (state == STATES.hasJumped))
            {
                entityState ^= STATES.jumping;
                entityState |= state;
                entityState &= ~(0xFFC00);
            }
        } break;

        case STATES.falling:
        {
            if (state != STATES.falling)
            {
                entityState ^= STATES.falling;
                entityState |= state;
                entityState &= ~(0xFFC00);
            }
        } break;
    }

    //switch ((entityState & 0x3000000))
    //{
    //    case STATES.attacking:
    //    {
    //        
    //    } break;

    //    case STATES.hurt
    //    {
    //        
    //    } break;
    //}

    return entityState;
}

function stateIncrement(entityState)
{
    var incr;

    if ((entityState & 0xF00000) > 0)
    {
        incr = ((entityState & 0xFFC00) >> 10) + 1;

        entityState = (entityState & ~(0xFFC00)) | (incr << 10);
    }

    if ((entityState & 0x3000000) > 0)
    {
        incr = (entityState & 0x3FF) + 1;

        entityState = (entityState & ~(0x3FF)) | incr;
    }

    return entityState;
}
