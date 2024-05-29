const roomField = document.getElementById("roomIdField");
const submitButton = document.getElementById("roomIdSubmit");

submitButton.addEventListener("click", () => {
	connectToRoom(roomField.value);
});

var socket = null;
const pageJoinRoom = document.getElementById("pageJoinRoom");
const pageConnecting = document.getElementById("pageConnecting");
const pageInRoomWaiting = document.getElementById("pageInRoomWaiting");
const pageInGame = document.getElementById("pageInGame");

const levelInfo = {
	"Rooftops": {
		"pixelOrigin": [61,138],
		"gridSize": [84,41],
		"coordOrigin": [-44, 18],
		"scale": 1176/41,
	},
	"Waterfall": {
		"pixelOrigin": [495,145],
		"gridSize": [48,39],
		"coordOrigin": [-20, 18],
		"scale": 1213/39,
	},
	"Farm": {
		"pixelOrigin": [461,227],
		"gridSize": [36,27],
		"coordOrigin": [-35, 11],
		"scale": 1094/27,
	},
	"WindMill": {
		"pixelOrigin": [787,85],
		"gridSize": [37,50],
		"coordOrigin": [-34, 30],
		"scale": 1327/50,
	},
	"RicketyHouse": {
		"pixelOrigin": [378,65],
		"gridSize": [42,34],
		"coordOrigin": [-40, 17],
		"scale": 1301/34
	},
	"Iceberg": {
		"pixelOrigin": [-5,433],
		"gridSize": [117,29],
		"coordOrigin": [-38, 22],
		"scale": 2575/117
	},
	"Pyramid": {
		"pixelOrigin": [315,436],
		"gridSize": [80,20],
		"coordOrigin": [-28, 3],
		"scale": 2134/80,
	},
	"MetalPlant": {
		"pixelOrigin": [657, -19],
		"gridSize": [44,44],
		"coordOrigin": [18, 34],
		"scale": 1388/44,
	},
	"DanceParty": {
		"pixelOrigin": [528,455],
		"gridSize": [58,20],
		"coordOrigin": [-29, 11],
		"scale": 679/20,
		"customImageFunction": (image) => {
			image.style.filter = "brightness(0%)";
		}
	},
	"CrumblingBridge": {
		"pixelOrigin": [334,205],
		"gridSize": [64,32],
		"coordOrigin": [-45,10],
		"scale": 983/32,
	},
	"WaterTower": {
		"pixelOrigin": [567,140],
		"gridSize": [44,33],
		"coordOrigin": [-44,11],
		"scale": 1549/44,
	},
	"RollerCoaster": {
		"pixelOrigin": [21, 440],
		"gridSize": [70, 22],
		"coordOrigin": [-55, 5],
		"scale": 793 / 22,
	},
	"JungleTemple": {
		"pixelOrigin": [161, 42],
		"gridSize": [85, 49],
		"coordOrigin": [-31, 14],
		"scale": 2302 / 85,
	},
	"SpaceLevel": {
		"pixelOrigin": [466, 116],
		"gridSize": [64, 48],
		"coordOrigin": [-31, 25],
		"scale": 1220 / 48,
	},
	"Volcano": {
		"pixelOrigin": [255, 157],
		"gridSize": [64, 41],
		"coordOrigin": [-40, 8],
		"scale": 1872 / 64,
	},
	"TronLevel": {
		"pixelOrigin": [51, 277],
		"gridSize": [75, 29],
		"coordOrigin": [-27, 14],
		"scale": 944 / 29,
	},
	"Pier": {
		"pixelOrigin": [-2, 375],
		"gridSize": [85, 28],
		"coordOrigin": [-39, 11],
		"scale": 2512 / 85,
	},
	"NuclearPlant": {
		"pixelOrigin": [1057, 78],
		"gridSize": [35, 67],
		"coordOrigin": [-12, 37],
		"scale": 615 / 35,
	},
	"Ballroom": {
		"pixelOrigin": [348, 107],
		"gridSize": [56, 38],
		"coordOrigin": [-27, 17],
		"scale": 1234 / 38,
	},
	"Raft": {
		"pixelOrigin": [211, 348],
		"gridSize": [79, 24],
		"coordOrigin": [-37, 21],
		"scale": 622 / 24,
	},
	"Raft-Night": {
		"pixelOrigin": [211, 348],
		"gridSize": [79, 24],
		"coordOrigin": [-37, 21],
		"scale": 622 / 24,
	},
	"Metro": {
		"pixelOrigin": [182, 470],
		"gridSize": [76, 17],
		"coordOrigin": [-31, 17],
		"scale": 2210 / 76,
	},
	"template": {
		"pixelOrigin": [0, 0],
		"gridSize": [0, 0],
		"coordOrigin": [0, 0],
		"scale": 1 / 1,
	}
};
const objectInfo = {
	"Block": {
		"offset": [0,0],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
	},
	"Double Block": {
		"offset": [-0.5,0],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
		"unevenOnRotate": [true, true],
	},
	"Triple Block": {
		"offset": [-1,0],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
	},
	"4-Block": {
		"offset": [-1.5,0],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
		"unevenOnRotate": [true, true],
	},
	"5-Block": {
		"offset": [-2,0],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
	},
	"6-Block": {
		"offset": [-2.5,0],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
		"unevenOnRotate": [true, true],
	},
	"Honey": {
		"offset": [0,0.1],
		"rotateOffset": [0, 0.75],
		"scrollAction": "rotate",
	},
	"Stairs": {
		"offset": [-1.5,-1.5],
		"rotateOffset": [0, 0],
		"scrollAction": "flipX",
	},
	"Hay Bale": {
		"offset": [-1,-1],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
	},
	"Barrel": {
		"offset": [-0.5,-0.5],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
	},
	"L-Girder": {
		"offset": [-1.5,-1.5],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
	},
	"Coin": {
		offset: [0, 0],
		"rotateOffset": [0, 0],
	},
	"Stopwatch": {
		"offset": [0,-0.35],
		"rotateOffset": [0, 0],
	},
	"Scaffold": {
		"offset": [0,-2],
		"rotateOffset": [0, -2],
		"scrollAction": "rotate",
	},
	"PressureTriggerSpikes": {
		"offset": [-1,-0.2],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
	},
	"Barbed Wire": {
		"offset": [0,0],
		"rotateOffset": [0, 0.5],
		"scrollAction": "rotate",
	},
	"Ice": {
		"offset": [0,0],
		"rotateOffset": [0, 0.8],
		"scrollAction": "rotate",
	},
	"Spikey Ball": {
		"offset": [-0.2,-0.3],
		"rotateOffset": [0, 0],
	},
	"Linear Saw": {
		"offset": [-2,0],
		"rotateOffset": [-0.5,-1],
		"overrides": {
			90: [0,-1],
			180: [-1,-1],
			270: [-1,0],
		},
		"scrollAction": "rotate",
		"scrollShiftAction": "flipX",
	},
	"Trap Door": {
		"offset": [-0.5,0],
		"rotateOffset": [0, 0],
	},
	"SwingingAxe": {
		"offset": [-6,-0.5],
		"rotateOffset": [0, 0],
		"scrollAction": "flipX",
	},
	"PunchingBlock": {
		"offset": [-0.95,-0.25],
		"rotateOffset": [0.8, 0],
		"scrollAction": "rotate",
	},
	"Flamethrower": {
		"offset": [-1,-1],
		"rotateOffset": [-1, -1],
		"scrollAction": "rotate",
	},
	"Beehive": {
		"offset": [-0.45,-0.65],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
	},
	"Spinning Death": {
		"offset": [0,-1.25],
		"rotateOffset": [0, -1],
		"scrollAction": "rotate",
	},
	"CrumbleBlockP": {
		"offset": [-1,-0.5],
		"rotateOffset": [1, 1.5],
		"scrollAction": "rotate",
	},
	"CrumbleBlockI": {
		"offset": [-1,-0.5],
		"rotateOffset": [1, 0.5],
		"scrollAction": "rotate",
	},
	"Cannon": {
		"offset": [-0.5,-1],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
	},
	"Blackhole": {
		"offset": [-1.25,-1.5],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
	},
	"Teleporter": {
		"offset": [0,-0.5],
		"rotateOffset": [0, -0.5],
		"scrollAction": "rotate",
	},
	"Ball Launcher": {
		"offset": [0,-0.2],
		"rotateOffset": [0,0],
		"overrides": {
			90: [-0.2,0.1],
			180: [0,0.2],
			270: [0.1,0.1],
		},
		"scrollAction": "flipX",
		"scrollShiftAction": "rotate",
	},
	"HockeyShooter": {
		"offset": [-1.1,-1],
		"rotateOffset": [0, -0.4],
		"scrollAction": "flipX",
		"scrollShiftAction": "rotate",
	},
	"Crossbow": {
		"offset": [-0.6,-0.5],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
	},
	"Jetpack Dispenser": {
		"offset": [-1,0],
		"rotateOffset": [0,-0.75],
		"overrides": {
			90: [0.6,0.7],
			180: [0,-1.3],
			270: [-0.6,-0.7],
		},
		"scrollAction": "flipX",
		"scrollShiftAction": "rotate",
	},
	"PunchingPlant": {
		"offset": [-0.8,-1.35],
		"rotateOffset": [0, -1],
		"scrollAction": "rotate",
		"scrollShiftAction": "flipX",
	},
	"Jetpack": {
		"offset": [0,-0.45],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
	},
	"Spinning Tire": {
		"offset": [-0.5,-0.5],
		"rotateOffset": [0, 0],
		"scrollAction": "flipX",
	},
	"UpBlower": {
		"offset": [-1,-0.2],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
	},
	"PaperAirplaneShooter": {
		"offset": [-1.25,-2],
		"rotateOffset": [0, 1],
		"scrollAction": "flipX",
		"scrollShiftAction": "rotate",
	},
	"SmoothRotate": {
		"offset": [0,-0.1],
		"rotateOffset": [0, 0],
		"scrollAction": "flipX",
	},
	"Spring": {
		"offset": [-0.5,-0.3],
		"rotateOffset": [0, -0.25],
		"scrollAction": "rotate",
	},
	"Fire Hydrant": {
		"offset": [0,-0.4],
		"rotateOffset": [0, 0.2],
		"scrollAction": "rotate",
	},
	"One Way Door": {
		"offset": [-0.6,-1.7],
		"rotateOffset": [-1, -0.625],
		"flipRotation": true,
		"scrollAction": "rotate",
		"scrollShiftAction": "flipX",
	},
	"Automatic Door": {
		"offset": [0,-1.5],
		"rotateOffset": [0, -0.5],
		"scrollAction": "rotate",
		"scrollShiftAction": "flipX",
	},
	"DiagonalMover": {
		"offset": [-3,-3],
		"rotateOffset": [3.1,-3.1],
		"flipRotation": true,
		"scrollAction": "rotate",
		"scrollShiftAction": "flipX",
	},
	"Treadmill": {
		"offset": [-1,0],
		"rotateOffset": [0, 0],
		"scrollAction": "flipX",
		"scrollShiftAction": "rotate",
	},
	"LongDistanceMove": {
		"offset": [-8.125,0],
		"rotateOffset": [8.125,0],
		"flipRotation": true,
		"scrollAction": "rotate",
		"scrollShiftAction": "flipX",
	},
	"Horizontal Moving Platform": {
		"offset": [-4.25,0],
		"rotateOffset": [3,0],
		"flipRotation": true,
		"scrollAction": "rotate",
		"scrollShiftAction": "flipX",
	},
	"Floating Platform": {
		"offset": [0,0],
		"rotateOffset": [0, 0],
		"scrollAction": "rotate",
		"scrollShiftAction": "flipX",
	},
	"FerrisWheel": {
		"offset": [-2,-2.5],
		"rotateOffset": [0, 0],
		"customImage": "FerrisWheelWithPlatforms",
		"scrollAction": "flipX",
	}
};

var allPlaceables = [];
var currentLevel = "Rooftops";

/* ITEM SYSTEM */
const coinCount = document.getElementById("coin-count");
var itemPrices = {};
var itemShops = [];
var coins = 0;
var itemPlacement = null;

function endItemPlacement() {
	if (itemPlacement) {
		itemPlacement.image.remove();
		itemPlacement = null;
	}
}

function buyItem(obj) {
	toggleItemPanel();
	endItemPlacement();

	const parent = document.getElementById("placeables");
	image = document.createElement("img");
	let imageUrl = obj;
	if (objectInfo[obj] && objectInfo[obj].customImage) {
		imageUrl = objectInfo[obj].customImage;
	}
	image.src = "/placeables/" + imageUrl + ".png";
	image.style.position = "absolute";
	parent.appendChild(image);

	const screenScaleX = 100 / 2560;
	const screenScaleY = 100 / 1409;
	const level = levelInfo[currentLevel];
	function setSize() {
		image.style.width = (((image.naturalWidth / 70) * level.scale) * screenScaleX) + "%";
		image.style.height = (((image.naturalHeight / 70) * level.scale) * screenScaleY) + "%";
	}
	if (image.complete) {
		setSize();
	} else {
		image.onload = () => {
			setSize();
		}
	}

	itemPlacement = {
		"obj": obj,
		"image": image,
		"rotation": 0,
		"scale": [1,1],
	};
	// socket.emit("placeItem", obj, -20, 5, 0, false, false);
}


let lastMousePosition = [0, 0];
function updateItemPlacement() {
	if (!itemPlacement || itemPlacement.submitted) {
		return;
	}
	const bounds = bg.getBoundingClientRect();
	const deg2Rad = Math.PI / 180;
	let x = Math.max(0, Math.min(1, (lastMousePosition[0] - bounds.left) / bounds.width));
	let y = Math.max(0, Math.min(1, (lastMousePosition[1] - bounds.top) / bounds.height));

	const level = levelInfo[currentLevel];
	const objInfo = objectInfo[itemPlacement.obj];

	let rot = itemPlacement.rotation;
	let scale = itemPlacement.scale;

	let offset = [0, 0];
	if (objInfo) {
		offset[0] = objInfo.offset[0];
		offset[1] = objInfo.offset[1];

		let rotOffset = objInfo.rotateOffset;
		let rotOffsetX = 0;
		let rotOffsetY = 0;

		if (objInfo.flipRotation) {
			rotOffsetX = Math.cos(-rot * deg2Rad) * rotOffset[0] * scale[0] - Math.sin(-rot * deg2Rad) * rotOffset[1] * scale[1];
			rotOffsetY = Math.sin(-rot * deg2Rad) * rotOffset[0] * scale[0] + Math.cos(-rot * deg2Rad) * rotOffset[1] * scale[1];
		} else {
			rotOffsetX = Math.cos(-rot * deg2Rad) * rotOffset[0] - Math.sin(-rot * deg2Rad) * rotOffset[1];
			rotOffsetY = Math.sin(-rot * deg2Rad) * rotOffset[0] + Math.cos(-rot * deg2Rad) * rotOffset[1];
		}

		offset[0] += rotOffsetX;
		offset[1] += rotOffsetY;

		let override = objInfo.overrides
		if (override && override[rot]) {
			offset[0] += override[rot][0];
			offset[1] += override[rot][1];
		}
	}

	x += ((offset[0] - 0.5) * level.scale) / 2560;
	y += ((offset[1] - 0.5) * level.scale) / 1409;

	// Snap to grid increments
	let gridStartPercentageX = level.pixelOrigin[0] / 2560;
	let gridStartPercentageY = level.pixelOrigin[1] / 1409;

	x = Math.round((x - gridStartPercentageX) * 2560 / level.scale) / 2560 * level.scale + gridStartPercentageX;
	y = Math.round((y - gridStartPercentageY) * 1409 / level.scale) / 1409 * level.scale + gridStartPercentageY;

	if (objInfo && objInfo.unevenOnRotate && (rot == 90 || rot == 270)) {
		if (objInfo.unevenOnRotate[0]) {
			x -= 0.5 * level.scale / 2560;
		}
		if (objInfo.unevenOnRotate[1]) {
			y += 0.5 * level.scale / 1409;
		}
	}

	itemPlacement.coords = [
		(x * 2560 - level.pixelOrigin[0]) / level.scale + level.coordOrigin[0],
		(y * 1409 - level.pixelOrigin[1]) / level.scale + level.coordOrigin[1]
	];
	itemPlacement.coords = [
		Math.round(itemPlacement.coords[0] * 2) / 2,
		Math.round(itemPlacement.coords[1] * 2) / 2,
	];
	console.log(itemPlacement.coords);

	// Set position
	image.style.position = "absolute";
	itemPlacement.image.style.left = x * 100 + "%";
	itemPlacement.image.style.top = y * 100 + "%";
	image.style.transform = "rotate(" + -rot + "deg) scale(" + scale[0] + "," + scale[1] + ")";
}

const bg = document.getElementById("wrapper");
document.body.onpointermove = (event) => {
	const { clientX, clientY } = event;
	lastMousePosition = [clientX, clientY];
	updateItemPlacement();
};
document.body.oncontextmenu = () => {
	if (!itemPlacement || itemPlacement.submitted) {
		return true;
	}

	endItemPlacement();
	return false;
}
bg.onwheel = (event) => {
	if (!itemPlacement || itemPlacement.submitted) {
		return;
	}

	function performAction(str) {
		switch (str) {
			case "rotate": {
				if (event.deltaY < 0) {
					// Clockwise
					itemPlacement.rotation -= 90;
				} else {
					// Counterclockwise
					itemPlacement.rotation += 90;
				}
				itemPlacement.rotation += 360;
				itemPlacement.rotation %= 360;
				break;
			}
			case "flipX": {
				itemPlacement.scale[0] *= -1;
				break;
			}
		}
		updateItemPlacement();
	}

	const objData = objectInfo[itemPlacement.obj];
	if (event.shiftKey && objData.scrollShiftAction) {
		performAction(objData.scrollShiftAction);
	} else {
		performAction(objData.scrollAction);
	}
}
bg.onclick = () => {
	if (!itemPlacement || itemPlacement.submitted) {
		return;
	}

	itemPlacement.submitted = true;
}

const template = document.getElementById("itemTemplate");
for (const obj of Object.keys(objectInfo)) {
	let newItem = template.cloneNode(true);
	newItem.id = "item-" + obj;
	newItem.classList.remove("hidden");
	template.parentElement.appendChild(newItem);

	let image = obj;
	if (objectInfo[obj].customImage) {
		image = objectInfo[obj].customImage;
	}

	newItem.childNodes[1].src = "/placeables/" + image + ".png";
	newItem.childNodes[3].addEventListener("click", () => {
		buyItem(obj);
	});
	newItem.childNodes[3].innerHTML = getItemPrice(obj) + " &#x1FA99;";

	itemShops.push({
		"item": obj,
		"image": newItem.childNodes[1],
		"button": newItem.childNodes[3],
	});
}

function getItemPrice(obj) {
	return 10;
}

function setCoins(newCoins) {
	coins = newCoins;
	for (const shop of itemShops) {
		shop.button.disabled = coins < getItemPrice(shop.item);
	}
	coinCount.innerHTML = coins + " &#x1FA99;";
}

setCoins(0);

function hideAllPages() {
	let pages = [pageJoinRoom, pageConnecting, pageInRoomWaiting, pageInGame];
	for (const page of pages) {
		page.classList.add("hidden");
	}
}

function showPage(page) {
	hideAllPages();
	page.classList.remove("hidden");
}

function connectToRoom(room) {
	showPage(pageConnecting);

	socket = io("/web");
	socket.on("connect", () => {
		console.log("Connected to the webserver");
		socket.emit("join", room);
	});

	socket.on("joinedroom", (roomState) => {
		showPage(pageInRoomWaiting);
		document.title = room + " | Ultimate Crowd Control Horse";
		window.history.pushState(null, document.title, "/" + room);
	});

	socket.on("updatePlaceables", (objects) => {
		console.log("updatePlaceables");
		console.log(objects);
		for (const obj of objects) {
			updatePlaceable(obj);
		}
	});

	socket.on("removePlaceables", (ids) => {
		console.log("removePlaceables");
		console.log(ids);
		let objectsToRemove = allPlaceables.filter(e => ids.includes(e.id));
		for (const obj of objectsToRemove) {
			removePlaceable(obj);
		}
	});

	socket.on("updateAllPlaceables", (objects) => {
		updateAllPlaceables(objects);
		// showPage(pageInGame);
	});

	socket.on("changeLevel", (newLevelName) => {
		currentLevel = newLevelName;
		if (newLevelName) {
			showPage(pageInGame);
			bg.style.backgroundImage = "url('/levels/" + newLevelName + ".png')";
		} else {
			showPage(pageInRoomWaiting);
			closeItemPanel();
		}
	});

	socket.on("setCoins", (newCoins) => {
		setCoins(newCoins);
	});
}

function updatePlaceable(serializedObj) {
	const parent = document.getElementById("placeables");
	const screenScaleX = 100 / 2560;
	const screenScaleY = 100 / 1409;
	const level = levelInfo[currentLevel];

	serializedObj.name = serializedObj.name.replace(/\(.*\)/, "").trim();
	let pos = serializedObj.pos;
	let rot = serializedObj.rot;
	let scale = serializedObj.scale;

	let placeable = allPlaceables.find(e => e.id == serializedObj.id);
	let image = null;

	if (placeable) {
		image = placeable.image;
	} else {
		// Create a new image for this
		image = document.createElement("img");
		image.id = serializedObj.id;
		image.src = "/placeables/" + serializedObj.name + ".png";
		parent.appendChild(image);

		placeable = {
			"id": serializedObj.id,
			"name": serializedObj.name,
			"image": image,
			"data": serializedObj.data,
		};
		allPlaceables.push(placeable);
	}

	const deg2Rad = Math.PI / 180;

	let objInfo = objectInfo[placeable.name];
	let offset = [0, 0];
	if (objInfo) {
		offset[0] = objInfo.offset[0];
		offset[1] = objInfo.offset[1];

		let rotOffset = objInfo.rotateOffset;
		let rotOffsetX = 0;
		let rotOffsetY = 0;

		if (objInfo.flipRotation) {
			rotOffsetX = Math.cos(-rot * deg2Rad) * rotOffset[0] * scale[0] - Math.sin(-rot * deg2Rad) * rotOffset[1] * scale[1];
			rotOffsetY = Math.sin(-rot * deg2Rad) * rotOffset[0] * scale[0] + Math.cos(-rot * deg2Rad) * rotOffset[1] * scale[1];
		} else {
			rotOffsetX = Math.cos(-rot * deg2Rad) * rotOffset[0] - Math.sin(-rot * deg2Rad) * rotOffset[1];
			rotOffsetY = Math.sin(-rot * deg2Rad) * rotOffset[0] + Math.cos(-rot * deg2Rad) * rotOffset[1];
		}

		offset[0] += rotOffsetX;
		offset[1] += rotOffsetY;

		let override = objInfo.overrides
		if (override && override[rot]) {
			offset[0] += override[rot][0];
			offset[1] += override[rot][1];
		}
	}

	// Set position
	image.style.position = "absolute";
	image.style.left = (((((pos[0] - level.coordOrigin[0]) + offset[0]) * level.scale) + level.pixelOrigin[0]) * screenScaleX) + "%";
	image.style.top = ((((-(pos[1] - level.coordOrigin[1]) + offset[1]) * level.scale) + level.pixelOrigin[1]) * screenScaleY) + "%";
	image.style.transform = "rotate(" + -rot + "deg) scale(" + scale[0] + "," + scale[1] + ")";
	if (level.customImageFunction) {
		level.customImageFunction(image);
	}

	// Jank...
	function setSize() {
		image.style.width = (((image.naturalWidth / 70) * level.scale) * screenScaleX) + "%";
		image.style.height = (((image.naturalHeight / 70) * level.scale) * screenScaleY) + "%";
	}
	if (image.complete) {
		setSize();
	} else {
		image.onload = () => {
			setSize();
		}
	}

	if (placeable.name == "Teleporter") {
		if (placeable.data.linked) {
			// Link!
			let teleporterImage = placeable.teleporterEffect;
			if (!placeable.teleporterEffect) {
				teleporterImage = document.createElement("img");
				teleporterImage.src = "/placeables/Teleporter-Effect.png";
				parent.appendChild(teleporterImage);
				placeable.teleporterEffect = teleporterImage;

				const index = allPlaceables.map(e => e.id).indexOf(placeable.id);
				allPlaceables[index] = placeable;
			}

			teleporterImage.style.position = image.style.position;
			teleporterImage.style.left = image.style.left;
			teleporterImage.style.top = image.style.top;
			teleporterImage.style.width = image.style.width;
			teleporterImage.style.height = image.style.height;
			teleporterImage.style.transform = image.style.transform;

			teleporterImage.style.filter =
				"brightness(" + (placeable.data.v * 100) + "%) " +
				"saturate(" + (placeable.data.s * 100) + "%) " +
				"hue-rotate(" + (placeable.data.h * 360 - 60) + "deg) ";

		} else {
			// Not linked
			if (placeable.teleporterEffect) {
				placeable.teleporterEffect.remove();
				placeable.teleporterEffect = null;

				const index = allPlaceables.map(e => e.id).indexOf(placeable.id);
				allPlaceables[index] = placeable;
			}
		}

	} else if (placeable.name == "FerrisWheel") {
		let newPlatforms = placeable.data.platforms;
		const platformOffsets = [[2, -3], [-3, -3], [-3, 2], [2, 2]];

		if (!placeable.platforms) {
			placeable.platforms = [null, null, null, null];
		}

		for (let i = 0; i < 4; i++) {
			let platform = placeable.platforms[i];
			if (newPlatforms[i]) {
				// Exists :)
				if (!platform) {
					// Create a new object.
					platform = document.createElement("img");
					platform.src = "/placeables/FerrisWheelPlatform.png";
					parent.appendChild(platform);
					placeable.platforms[i] = platform;
				}

				platform.style.position = "absolute";
				platform.style.left = (((((pos[0] - level.coordOrigin[0]) + platformOffsets[i][0]) * level.scale) + level.pixelOrigin[0]) * screenScaleX) + "%";
				platform.style.top = ((((-(pos[1] - level.coordOrigin[1]) + platformOffsets[i][1]) * level.scale) + level.pixelOrigin[1]) * screenScaleY) + "%";
				platform.style.width = ((platform.naturalWidth / 70) * level.scale * screenScaleX) + "%";
				platform.style.height = ((platform.naturalHeight / 70) * level.scale * screenScaleY) + "%";
				// platform.style.transform = "rotate(" + -rot + "deg) scale(" + scale[0] + "," + scale[1] + ")";

				if (level.customImageFunction) {
					level.customImageFunction(platform);
				}

			} else {
				// Doesn't exist :(
				if (platform && platform != null) {
					// Remove it...
					platform.remove();
					placeable.platforms[i] = null;
				}
			}
		}

		const index = allPlaceables.map(e => e.id).indexOf(placeable.id);
		allPlaceables[index] = placeable;
	}
}

function removePlaceable(obj) {
	if (obj.teleporterEffect) {
		obj.teleporterEffect.remove();
	}
	if (obj.platforms) {
		for (const platform of obj.platforms) {
			if (platform != null) {
				platform.remove();
			}
		}
	}
	obj.image.remove();
	allPlaceables = allPlaceables.filter(e => e.id !== obj.id);
}

function updateAllPlaceables(objects) {
	// Delete all objects...
	for (const obj of allPlaceables) {
		removePlaceable(obj);
	}

	// And replace them with new ones.
	for (const obj of objects) {
		updatePlaceable(obj);
	}
}

window.onpopstate = function (event) {
	if (socket != null) {
		socket.disconnect();
		socket = null;
	}
	if (event.state == null) {
		// Return to the homepage...
		showPage(pageJoinRoom);
		document.title = "Ultimate Crowd Control Horse";
	} else {
		// Joining a room...
		connectToRoom(event.state);
	}
}

if (instaJoinRoom) {
	connectToRoom(instaJoinRoom);
}
