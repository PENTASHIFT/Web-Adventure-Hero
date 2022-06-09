"use strict";

/*
    Implementation of Microsoft's VIPS algorithm found here:
        https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-2003-79.pdf
*/

// NOTE(josh): It may not be worth it to implement the separator portion of this
//              algorithm.

class MSVIPS
{
    constructor(root, dim, sh)
    {
        this.rounds = 10;
        this.root = root;

        this.win = { width: dim.width, height: dim.height };

        this.sh = sh;   // See utils/spatialhash.js
        
        // NOTE(josh): May make sense to dynamically set this.
        this.threshold = 250;

        this._blockExtractor(root);
    }

    _isInline(name)
    {
        switch(name)
        {
            case "A":
            case "ABBR":
            case "ACRONYM":
            case "B":
            case "BDO":
            case "BIG":
            case "BR":
            case "BUTTON":
            case "CITE":
            case "CODE":
            case "DFN":
            case "EM":
            case "I":
            case "IMG":
            case "INPUT":
            case "KBD":
            case "LABEL":
            case "MAP":
            case "OBJECT":
            case "Q":
            case "SAMP":
            case "SCRIPT":
            case "SELECT":
            case "SMALL":
            case "SPAN":
            case "STRONG":
            case "SUB":
            case "SUP":
            case "TEXTAREA":
            case "TIME":
            case "TT":
            case "VAR":
            {
                return true;
            }

            default:
            {
                return false;
            }
        }
    }

    // If the node is not a text node and it has no valid children, it cannot be
    // divided further.
    _ruleOne(elm) { return (elm.children.length == 0) }

    // If the node only has on valid child and the child is not a text-node,
    // then divide this node.
    _ruleTwo(elm) { return (elm.children.length == 1) }

    // If the node is the root node of the sub-DOM tree (corresponding to the
    // block), and there is only one sub DOM tree corresponding to this
    // block, divide the node.
    _ruleThree(elm) { return false; }  // Skipping this rule.

    // If all the child nodes of the node are text-nodes or virtual text-nodes*,
    // do not divide the node.
    _ruleFour(elm)
    {

        // *virtual text-nodes are inline nodes that only have text-nodes as
        // children.

        var children = elm.childNodes;

        // Modified this so maximum depth is 2 rather than *potentially* endless
        for (let i = 0; i < children.length; i++)
        {
            if (children[i].nodeType != 3)
            {
                if (!this._isInline(children[i].tagName))
                    return false;

                var grandchildren = children[i].childNodes;
                for (let ii = 0; ii < grandchildren.length; ii++)
                {
                    if (grandchildren[ii].nodeType != 3)
                    {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    // If one of the child nodes of the node is a line-break node, then divide
    // this node.
    _ruleFive(elm)
    {
        var children = elm.children;
        for (let i = 0; i < children.length; i++)
        {
            if (!this._isInline(children[i].tagName))
                return true;
        }

        return false;
    }

    // If one of the child nodes of the node has the tag <HR>, then divide this
    // node.
    _ruleSix(elm)
    {
        var children = elm.children;
        
        for (let i = 0; i < children.length; i++)
        {
            if (children[i].tagName == "HR")
                return true;
        }

        return false;
    }

    // If the sum of all the child nodes' sizes is greater than the node's size,
    // then divide this node.
    _ruleSeven(elm)
    {
        var childWidth = 0;
        var childHeight = 0;
        var children = elm.children;

        var elmSize = elm.getBoundingClientRect();

        for (let i = 0; i < children.length; i++)
        {
            childWidth += children[i].getBoundingClientRect().width;
            childHeight += children[i].getBoundingClientRect().height;
        }

        if ((childWidth > elmSize.width) || (childHeight > elmSize.height))
            return true;

        return false;
    }

    // If the background color of this node is different from one of its
    // children, divide this node.
    _ruleEight(elm)
    {
        var children = elm.children;
        var elmBg = window.getComputedStyle(elm)["background-color"];

        for (let i = 0; i < children.length; i++)
        {
            var childBg = window.getComputedStyle(children[i]);

            if (childBg["background-color"] != elmBg)
                return true;
        }

        return false;
    }

    // If the node has at least one text node or at least one virtual text node,
    // and the node's relative size is smaller than a threshold, then the
    // node cannot be divided.
    _ruleNine(elm)
    {
        // Requires threshold.
        return false;
    }

    // If the child of this node with a maxmimum size is smaller than a
    // threshold (relative size), do not divide this node.
    _ruleTen(elm)
    {
        var max = 0;
        var children = elm.children;

        for (let i = 0; i < children.length; i++)
        {
            var childRect = children[i].getBoundingClientRect();

            if ((childRect.width * childRect.height) > max)
                max = (childRect.width * childRect.height);
        }

        if (max < this.threshold)
            return true;
        
        return false;
    }

    // If the previous sibling node has not been divided, do not divide this
    // node.
    _ruleEleven(elm) { return false; }     // Skipping this rule due to disuse.

    _isDividable(elm, name)
    {
        if (name == "IMG")
            return false;

        if (this._ruleOne(elm))
            return false;
        if (this._ruleTwo(elm))
            return true;
        if (this._ruleThree(elm))
            return true;

        if (this._isInline(name))
            name = "INLINE";

        switch (name)
        {
            case "P":
            case "INLINE":
            {
                if (this._ruleFour(elm))
                    return false;
                if (this._ruleFive(elm))
                    return true;
                if (this._ruleSix(elm))
                    return true;
                if (this._ruleSeven(elm))
                    return true;
                if (this._ruleNine(elm))
                    return false;
                if (this._ruleTen(elm))
                    return false;

                return true;
            }

            case "TR":
            case "TABLE":
            {
                if ((name == "TR") && (this._ruleSeven(elm)))
                    return true;
                if (this._ruleEight(elm))
                    return true;
                if (this._ruleTen(elm))
                    return false;

                return false;
            }

            // None of the rules after 3 will return true.
            case "TD":
            {
                return false;
            }

            default:
            {
                if (this._ruleFour(elm))
                    return false;
                if (this._ruleSix(elm))
                    return true;
                if (this._ruleSeven(elm))
                    return true;
                if (this._ruleNine(elm))
                    return false;
                if (this._ruleTen(elm))
                    return false;

                return true;
            }
        }
    }

    _thresholdCheck(elm)
    {
        var elmRect = elm.getBoundingClientRect();

        if (((elmRect.width * elmRect.height) > this.threshold) &&
            (elmRect.x >= 0) && (elmRect.y >= 0) &&
            ((elmRect.x + elmRect.width) <= this.win.width) &&
            ((elmRect.y + elmRect.height) <= this.win.height))
        {
            return true;
        }

        return false;
    }

    _insert(elm)
    {
        var elmRect = elm.getBoundingClientRect();

        this.sh.insertObject(
            new Entity([
                elmRect.x,
                elmRect.y,
                elmRect.width,
                elmRect.height
            ])
        );  // See utils/spatialhash.js
    }

    // This is not a part of the original MSVIPS algorithm, but it added to
    // correct for some behavior of the original algorithm. Namely, I want to
    // retain some larger blocks (e.g., headers and footers) for use as solid
    // structures.
    _contrastExtractor(elm)
    {
        var elmBg = window.getComputedStyle(elm)["background-color"];

        // Transparent background.
        if (elmBg == "rgba(0, 0, 0, 0)")
            return false;

        var pBg = window.getComputedStyle(elm.parentNode)["background-color"];

        if (pBg != elmBg)
            return true;
        
        return false;
    }

    _blockExtractor(elm)
    {
        var b = Array.from(this.root.children);
        
        for (let i = 1; i < this.rounds && b.length > 0; i++)
        {
            var nextRound = new Array;

            while (b.length > 0)
            {
                var elm = b.pop();

                if (this._isDividable(elm, elm.tagName))
                {
                    if ((this._contrastExtractor(elm)) &&
                        (this._thresholdCheck(elm)))
                    {
                        this._insert(elm);
                    }

                    nextRound = nextRound.concat(Array.from(elm.children));
                }
                else
                {
                    var elmRect = elm.getBoundingClientRect();

                    if (this._thresholdCheck(elm))
                    {
                        this._insert(elm);
                    }
                }
            }

            b = nextRound;
        }
        
        for (let i = 0; i < b.length; i++)
        {
            this._insert(b[i]);
        }
    }
}
