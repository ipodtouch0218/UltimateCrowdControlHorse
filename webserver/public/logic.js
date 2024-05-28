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
	}
};
const objectInfo = {
	"Block": {
		"offset": [0,0],
		"rotateOffset": [0,0],
	},
	"Double Block": {
		"offset": [-0.5,0],
		"rotateOffset": [0,0],
	},
	"Triple Block": {
		"offset": [-1,0],
		"rotateOffset": [0,0],
	},
	"4-Block": {
		"offset": [-1.5,0],
		"rotateOffset": [0,0],
	},
	"5-Block": {
		"offset": [-2,0],
		"rotateOffset": [0,0],
	},
	"6-Block": {
		"offset": [-2.5,0],
		"rotateOffset": [0,0],
	},
	"Honey": {
		"offset": [0,0.1],
		"rotateOffset": [0,0.75]
	},
	"Stairs": {
		"offset": [-1.5,-1.5],
		"rotateOffset": [0,0]
	},
	"Hay Bale": {
		"offset": [-1,-1],
		"rotateOffset": [0,0]
	},
	"Barrel": {
		"offset": [-0.5,-0.5],
		"rotateOffset": [0,0]
	},
	"L-Girder": {
		"offset": [-1.5,-1.5],
		"rotateOffset": [0,0]
	},
	"Stopwatch": {
		"offset": [0,-0.35],
		"rotateOffset": [0,0]
	},
	"Scaffold": {
		"offset": [0,-2],
		"rotateOffset": [0,-2]
	},
	"PressureTriggerSpikes": {
		"offset": [-1,-0.2],
		"rotateOffset": [0,0]
	},
	"Barbed Wire": {
		"offset": [0,0],
		"rotateOffset": [0,0.5]
	},
	"Ice": {
		"offset": [0,0],
		"rotateOffset": [0,0.8]
	},
	"Spikey Ball": {
		"offset": [-0.2,-0.3],
		"rotateOffset": [0,0]
	},
	"Linear Saw": {
		"offset": [-2,0],
		"rotateOffset": [-0.5,-1],
		"overrides": {
			90: [0,-1],
			180: [-1,-1],
			270: [-1,0],
		}
	},
	"Trap Door": {
		"offset": [-0.5,0],
		"rotateOffset": [0,0]
	},
	"SwingingAxe": {
		"offset": [-6,-0.5],
		"rotateOffset": [0,0]
	},
	"PunchingBlock": {
		"offset": [-0.95,-0.25],
		"rotateOffset": [0.8,0]
	},
	"Flamethrower": {
		"offset": [-1,-1],
		"rotateOffset": [-1,-1],
	},
	"Beehive": {
		"offset": [-0.45,-0.65],
		"rotateOffset": [0,0],
	},
	"Spinning Death": {
		"offset": [0,-1.25],
		"rotateOffset": [0,-1],
	},
	"CrumbleBlockP": {
		"offset": [-1,-0.5],
		"rotateOffset": [1,1.5],
	},
	"CrumbleBlockI": {
		"offset": [-1,-0.5],
		"rotateOffset": [1,0.5]
	},
	"Cannon": {
		"offset": [-0.5,-1],
		"rotateOffset": [0,0],
	},
	"Blackhole": {
		"offset": [-1.25,-1.5],
		"rotateOffset": [0,0],
	},
	"Teleporter": {
		"offset": [0,-0.5],
		"rotateOffset": [0,-0.5],
	},
	"Ball Launcher": {
		"offset": [0,-0.2],
		"rotateOffset": [0,0],
		"overrides": {
			90: [-0.2,0.1],
			180: [0,0.2],
			270: [0.1,0.1],
		}
	},
	"HockeyShooter": {
		"offset": [-1.1,-1],
		"rotateOffset": [0,-0.4],
	},
	"Crossbow": {
		"offset": [-0.6,-0.5],
		"rotateOffset": [0,0],
	},
	"Jetpack Dispenser": {
		"offset": [-1,0],
		"rotateOffset": [0,-0.75],
		"overrides": {
			90: [0.6,0.7],
			180: [0,-1.3],
			270: [-0.6,-0.7],
		}
	},
	"PunchingPlant": {
		"offset": [-0.8,-1.35],
		"rotateOffset": [0,-1]
	},
	"Jetpack": {
		"offset": [0,-0.45],
		"rotateOffset": [0,0],
	},
	"Spinning Tire": {
		"offset": [-0.5,-0.5],
		"rotateOffset": [0,0],
	},
	"UpBlower": {
		"offset": [-1,-0.2],
		"rotateOffset": [0,0],
	},
	"PaperAirplaneShooter": {
		"offset": [-1.25,-2],
		"rotateOffset": [0,1],
	},
	"SmoothRotate": {
		"offset": [0,-0.1],
		"rotateOffset": [0,0],
	},
	"Spring": {
		"offset": [-0.5,-0.3],
		"rotateOffset": [0,-0.25],
	},
	"Fire Hydrant": {
		"offset": [0,-0.4],
		"rotateOffset": [0,0.2],
	},
	"One Way Door": {
		"offset": [-0.6,-1.7],
		"rotateOffset": [-1,-0.625],
	},
	"Automatic Door": {
		"offset": [0,-1.5],
		"rotateOffset": [0,-0.5],
	},
	"DiagonalMover": {
		"offset": [-3,-3],
		"rotateOffset": [3.1,-3.1],
		"flipRotation": true,
	},
	"Treadmill": {
		"offset": [-1,0],
		"rotateOffset": [0,0],
	},
	"LongDistanceMove": {
		"offset": [-8.125,0],
		"rotateOffset": [8.125,0],
		"flipRotation": true,
	},
	"Horizontal Moving Platform": {
		"offset": [-4.25,0],
		"rotateOffset": [3,0],
		"flipRotation": true,
	},
	"Floating Platform": {
		"offset": [0,0],
		"rotateOffset": [0,0],
	},
	"FerrisWheel": {
		"offset": [-2,-2.5],
		"rotateOffset": [0,0],
	}
};

var allPlaceables = [];
var currentLevel = "Rooftops";

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
		updatePlaceables(objects);
		showPage(pageInGame);
	});

	socket.on("changeLevel", (newLevelName) => {
		currentLevel = newLevelName;
		if (newLevelName == null) {
			// back in the lobby
			showPage(pageInRoomWaiting);
		} else {
			showPage(pageInGame);
			document.getElementById("wrapper").style.backgroundImage = "url('/levels/" + newLevelName + ".png')";
		}
	});
}

function updatePlaceables(objects) {
	toDelete = [...allPlaceables]
	let parent = document.getElementById("placeables");

	let bg = document.getElementById("levelBackground");
	let screenScaleX = 100 / 2560;
	let screenScaleY = 100 / 1409;
	let level = levelInfo[currentLevel];

	for (const obj of objects) {

		obj.name = obj.name.replace(/\(.*\)/, "").trim();

		let placeable = allPlaceables.find(e => e.id == obj.id);
		let image = null;

		if (placeable) {
			image = placeable.image;
		} else {
			// Create a new image for this
			image = document.createElement("img");
			image.id = obj.id;
			image.src = "/placeables/" + obj.name + ".png";
			parent.appendChild(image);

			placeable = {
				"id": obj.id,
				"name": obj.name,
				"image": image,
				"data": obj.data,
			};
			allPlaceables.push(placeable);
		}

		const deg2Rad = Math.PI / 180;

		let objInfo = objectInfo[placeable.name];
		let offset = [0, 0];
		if (objInfo != undefined) {
			offset[0] = objInfo.offset[0];
			offset[1] = objInfo.offset[1];

			let rotOffsetX = 0;
			let rotOffsetY = 0;

			if (objInfo.flipRotation) {
				rotOffsetX = Math.cos(-obj.rotation * deg2Rad) * objInfo.rotateOffset[0] * obj.localScale.X - Math.sin(-obj.rotation * deg2Rad) * objInfo.rotateOffset[1] * obj.localScale.Y;
				rotOffsetY = Math.sin(-obj.rotation * deg2Rad) * objInfo.rotateOffset[0] * obj.localScale.X + Math.cos(-obj.rotation * deg2Rad) * objInfo.rotateOffset[1] * obj.localScale.Y;
			} else {
				rotOffsetX = Math.cos(-obj.rotation * deg2Rad) * objInfo.rotateOffset[0] - Math.sin(-obj.rotation * deg2Rad) * objInfo.rotateOffset[1];
				rotOffsetY = Math.sin(-obj.rotation * deg2Rad) * objInfo.rotateOffset[0] + Math.cos(-obj.rotation * deg2Rad) * objInfo.rotateOffset[1];
			}

			offset[0] += rotOffsetX;
			offset[1] += rotOffsetY;

			let override = objInfo.overrides
			if (override != undefined && override[obj.rotation] != undefined) {
				offset[0] += override[obj.rotation][0];
				offset[1] += override[obj.rotation][1];
			}
		}

		// Set position
		image.style.position = "absolute";
		image.style.left = (((((obj.position.X - level.coordOrigin[0]) + offset[0]) * level.scale) + level.pixelOrigin[0]) * screenScaleX) + "%";
		image.style.top = ((((-(obj.position.Y - level.coordOrigin[1]) + offset[1]) * level.scale) + level.pixelOrigin[1]) * screenScaleY) + "%";
		image.style.width = (((image.naturalWidth / 70) * level.scale) * screenScaleX) + "%";
		image.style.height = (((image.naturalHeight / 70 ) * level.scale) * screenScaleY) + "%";
		image.style.transform = "rotate(" + -obj.rotation + "deg) scale(" + obj.localScale.X + "," + obj.localScale.Y + ")";

		if (placeable.name == "Teleporter") {

			if (obj.data.linked) {
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
					"brightness(" + (obj.data.v * 100) + "%) " +
					"saturate(" + (obj.data.s * 100) + "%) " +
					"hue-rotate(" + (obj.data.h * 360 - 60) + "deg) ";

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
			let newPlatforms = obj.data.platforms;
			const platformOffsets = [[2,-3],[-3,-3],[-3,2],[2,2]];

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
					platform.style.left = (((((obj.position.X - level.coordOrigin[0]) + platformOffsets[i][0]) * level.scale) + level.pixelOrigin[0]) * screenScaleX) + "%";
					platform.style.top = ((((-(obj.position.Y - level.coordOrigin[1]) + platformOffsets[i][1]) * level.scale) + level.pixelOrigin[1]) * screenScaleY) + "%";
					platform.style.width = ((platform.naturalWidth / 70) * level.scale * screenScaleX) + "%";
					platform.style.height = ((platform.naturalHeight / 70 ) * level.scale * screenScaleY) + "%";
					// platform.style.transform = "rotate(" + -obj.rotation + "deg) scale(" + obj.localScale.X + "," + obj.localScale.Y + ")";

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

		toDelete = toDelete.filter(e => e.id !== placeable.id);
	}

	// Delete these objects, they no longer exist
	for (const obj of toDelete) {
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