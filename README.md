![Ultimate Crowd Control Horse](https://github.com/ipodtouch0218/UltimateCrowdControlHorse/blob/master/webserver/public/ui/Logo.png?raw=true)
**(THIS MOD IS A HEAVY WORK IN PROGRESS)**

# About

A crowd control mod for Ultimate Chicken Horse!

> But doesn't UCH already have the Twitch integration mode?

Yes! But it's not that interactive! This is better!
This mod allows users to place items using the website (or your own, if
you wish to self-host...)

# Using the mod
### How to host a game

Currently, every player will need to have the mod installed to be able to see objects placed by viewers. The easiest way to install the mod is through [r2modman](https://thunderstore.io/package/ebkr/r2modman/), install the UltimateCrowdControlHorse package from the "Online" tab.

When hosting a game, the mod will automatically connect to the webserver. Viewers can then join through a code (separate from the Invite Code for joining within UCH!), which can be found with the "Lobby" tab of the settings menu. 

Configuration settings for prices, coins, etc are all accessible through r2modman's "Config editor", or within the `BepInEx/config/ipodtouch0218.UccH.cfg` configuration file within the Ultimate Chicken Horse game's folder.

---

### How to join as a client (a player *inside* UCH)

Simply ensure that you have the UltimateCrowdControlHorse mod installed, preferrably through [r2modman](https://thunderstore.io/package/ebkr/r2modman/). 

---

### How to join as a viewer (a player using the *website*)

The website is available at https://ucch.azurewebsites.net/. Simply enter the room code provided by the game's host, or append the room code to the end of the URL. **Do note that the room code is different from the invite code within UCH! This is to prevent viewers from joining the game uninvited!** If you want to play with someone that's self-hosting, you will have to use their provided URL. The website at https://ucch.azurewebsites.net/ will *NOT* work.

# How to use the website
### Coins
Coins are the currency used to purchase items within the game. You are given a certain amount of coins at the beginning of every round, and you are also given additional coins at the beginning of every round (configurable by the host).

Unlike other *Crowd Control* applications, coins are not purchaseable through any store or through stream donations.

---

### The item menu
The list of available objects can be found through the menu on the right side of the screen. Click the "«" to reveal the item menu, and click the "»" to hide the item menu.
Item prices are calculated based on their current probability of appearing within the Party Box, which changes depending on the state of the game. For example, if no one reaches the goal, the cost of traps will be higher and the price of basic blocks will be lower.

The item menu also shows you your available coins, as well as allowing you to filter by purchaseable items only.

---

### Placing items
To place items, expand up the item menu and click on the button for a given item to enter placement mode.

In placement mode, the controls are:
* Left click: place an object at the current selected position
* Right click: cancel placement of the object
* Scroll wheel or [Q]/[E]: rotate or flip the item (mirrors on how the object flips/rotates in UCH)
* Shift key: hold to change the rotation / flip mode for the item (mirrors on how the object flips/rotates in UCH) 

After placing objects, you will be given a certain cooldown (configurable by the host), which you must wait util placing another item.
You will also be unable to place items while the in-game players are not in build mode (configurable by the host)

# Known issues
Glossary: 
* "Host" = The player who created the game *inside of UCH*.
* "Client" = A player who joined the game *inside of UCH*.
* "Viewer" = A player who connected to the *website* and can *only* place objects.

* Clients who join without the mod cannot see items placed by viewers.
* Viewers cannot see the breakable blocks within the map "Crumbling Bridge".
* Viewers cannot see the added blocks within the map "Mainframe".
* Viewers will sometimes have objects de-synchronize, such as the Ferris Wheel.
* Clients will sometimes lose their ability to place items, or will sometimes see a creative mode cursor by mistake. (They cannot access an inventory, however).
* Viewers are unable to purchase items outside of Party mode (they will display as "null" coins).
* Viewers who are unable to scroll (no scroll wheel on mouse, mobile devices) cannot rotate items. 
