/*
    Implementation of Microsoft's VIPS algorithm found here:
        https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-2003-79.pdf
*/

"use strict";

var rootStyle, rootBg;

rootStyle = window.getComputedStyle(document.body);

if (rootStyle["background-color"] == "rgba(0, 0, 0, 0)")
{
    // This accounts for background color being set in HTML or :root.
    rootStyle = window.getComputedStyle(
        document.documentElement
    );
}

rootBg = rootStyle["background-color"];

function VIPS(elm, sh)
{
    // DFS-esque implementation of DOM transversal.
    var stack = new Array;

    // Skip root body node.
    for (let i = 0; i < elm.children.length; i++)
        stack.push(elm.children[i]);
    
    while (stack.length > 0)
    {
        var currentNode = stack.pop();
        if (!currentNode)
            continue;

        if (currentNode.id == "Web Adventure")
            continue;
        
        // If the background color is different than the root background.
        var bg = window.getComputedStyle(currentNode)["background-color"];

        if ((bg != "rgba(0, 0, 0, 0)") && (bg != rootBg))
        {
            let domRect = currentNode.getBoundingClientRect();

            if ((domRect.x >= 0) &&
                (domRect.y >= 0) &&
                (domRect.width > 0) &&
                (domRect.height > 0) &&
                (domRect.x <= window.innerWidth) &&
                (domRect.y <= window.innerHeight))
            {
                // Add element as a barrier.
                console.log(domRect.x + ", " + domRect.y + ", " + domRect.width
                    + ", " + domRect.height);

                if ((domRect.x + domRect.width) > window.innerWidth)
                    domRect.width = (window.innerWidth - domRect.x);
                if ((domRect.y + domRect.height) > window.innerHeight)
                    domRect.height = (window.innerHeight - domRect.y);

                sh.insertObject(
                    new Entity([
                        domRect.x,
                        domRect.y,
                        domRect.width,
                        domRect.height
                    ])
                ); // See utils/spatialhash.js
            }
        }

        for (let i = 0; i < currentNode.children.length; i++)
            stack.push(currentNode.children[i]);
    }

    // NOTE(josh): May not end up using these.
    // Ceiling
    sh.insertObject(new Entity([ 0, 0, window.innerWidth, 1 ]));
    // Floor
    sh.insertObject(
        new Entity([ 0, window.innerHeight - 1, window.innerWidth, 1 ])
    );
    // Left wall
    sh.insertObject(new Entity([ 0, 0, 1, window.innerHeight ]));
    // Right wall
    sh.insertObject(
        new Entity([ window.innerWidth - 1, 0, 1, window.innerHeight ])
    );
}
