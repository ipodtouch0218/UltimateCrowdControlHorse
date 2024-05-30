using BepInEx;
using BepInEx.Configuration;
using BepInEx.Logging;
using GameEvent;
using HarmonyLib;
using SocketIOClient;
using SocketIOClient.Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using UltimateCrowdControlHorse.Patches;
using UnityEngine;
using UnityEngine.Networking;

namespace UltimateCrowdControlHorse {
    [BepInPlugin(modGUID, "Ultimate Crowd Control Horse", "0.0.1")]
    public class CrowdControlMod : BaseUnityPlugin {

        private const string modGUID = "ipodtouch0218.UccH";
        private readonly Harmony harmony = new Harmony(modGUID);

        //---Configuration
        public static ConfigEntry<string> webserverUrl;
        public static ConfigEntry<bool> socketLogging;
        public static ConfigEntry<float> buildCooldown;
        public static ConfigEntry<bool> canBuildInPlayMode;

        public static ConfigEntry<int> minCoins;
        public static ConfigEntry<int> totalCoins;
        public static ConfigEntry<int> minPrice;
        public static ConfigEntry<int> maxPrice;
        public static ConfigEntry<bool> unlimitedCoins;

        //---Static
        public static CrowdControlMod Instance { get; private set; }

        //---Properties
        public bool IsConnected => socket != null && socket.Connected;

        //---Variables
        public ManualLogSource log;

        public readonly List<SerializedPlaceable> pendingUpdates = new List<SerializedPlaceable>();
        public readonly List<int> pendingRemovals = new List<int>();

        private HashSet<Placeable> placeablePrefabs = new HashSet<Placeable>();
        private SocketIOUnity socket;
        private string currentLevel;
        private string roomId;
        private bool inEditMode;



        public void Awake() {
            if (Instance == null) {
                Instance = this;
            }
            log = BepInEx.Logging.Logger.CreateLogSource(modGUID);

            webserverUrl = Config.Bind("General", "webserverUrl", "http://localhost:3000/", "The webserver for the crowd control system");

            buildCooldown = Config.Bind("Gameplay", "buildCooldown", 30f, "Length of the cooldown (in seconds) an individual chatter must wait before placing another item");
            canBuildInPlayMode = Config.Bind("Gameplay", "canBuildInPlayMode", false, "Allows chatters to place items while in Play mode");

            minCoins = Config.Bind("Gameplay", "minCoins", 100, "The minimum number of coins an individual chatter will be given. Technically, it raises the actual amount of coins above the total.");
            totalCoins = Config.Bind("Gameplay", "totalCoins", 1000, "The total number of coins the chat splits in a single game.");
            minPrice = Config.Bind("Gameplay", "minPrice", 25, "The minimum price an object can have (based on spawning chances)");
            maxPrice = Config.Bind("Gameplay", "maxPrice", 100, "The maximum price an object can have (based on spawning chances)");
            unlimitedCoins = Config.Bind("Gameplay", "unlimitedCoins", false, "Gives chatters unlimited coins to spend on placing items.");

            socketLogging = Config.Bind("Debug", "socketLogging", false, "Logs additional information about the websocket connection to the console");

            harmony.PatchAll();
            log.LogInfo("Ultimate Crowd Control Horse (UccH) Initialized!");
        }

        public void Update() {
            // Send outgoing messages
            if (pendingUpdates.Count > 0) {
                // Select only distinct updates (last so the LAST version gets sent)
                var array = pendingUpdates.GroupBy(p => p.id).Select(g => g.Last()).ToArray();
                SendSocketMessage("updatePlaceables", (object) array);
                pendingUpdates.Clear();
            }
            if (pendingRemovals.Count > 0) {
                // Select only distinct removals
                var array = pendingRemovals.Distinct().ToArray();
                SendSocketMessage("removePlaceables", (object) array);
                pendingRemovals.Clear();
            }
        }

        public void ConnectToWebserver(string roomId) {
            socket = new SocketIOUnity(webserverUrl.Value, new SocketIOOptions {
                EIO = 4,
                Transport = SocketIOClient.Transport.TransportProtocol.WebSocket
            });
            socket.JsonSerializer = new NewtonsoftJsonSerializer();
            socket.OnConnected += (object sender, EventArgs e) => {
                log.LogInfo("[SOCKET] Connected to the UccH webserver");
                SendSocketMessage("join", roomId);
                SendSocketMessage("changeLevel", currentLevel);
                SendSocketMessage("canPlaceItems", currentLevel != null && (inEditMode || canBuildInPlayMode.Value));
                SendSocketMessage("setCoinSettings", minCoins.Value, totalCoins.Value, minPrice.Value, maxPrice.Value, unlimitedCoins.Value);
                PlaceablePatch.UpdateAllPlaceables();
            };
            socket.OnDisconnected += (object sender, string str) => {
                log.LogInfo("[SOCKET] Disconnected from the UccH webserver");
            };

            socket.OnUnityThread("placeItem", (response) => {
                log.LogInfo("place item!");
                string clientId = response.GetValue<string>(0);
                string objName = response.GetValue<string>(1);
                float x = response.GetValue<float>(2);
                float y = response.GetValue<float>(3);
                int rotation = response.GetValue<int>(4);
                bool flipX = response.GetValue<bool>(5);
                bool flipY = response.GetValue<bool>(6);

                log.LogInfo($"{clientId} {objName} {x} {y} {rotation} {flipX} {flipY}");

                PlacePieceFromNetwork(clientId, objName, new Vector2(x, y), rotation, flipX, flipY);
            });

            log.LogInfo("Attempting to connect to the UccH webserver...");
            socket.Connect();
        }

        public void DisconnectFromWebserver() {
            if (socket == null || !socket.Connected) {
                return;
            }
            socket.Disconnect();
            socket = null;
        }

        public async void SendSocketMessage(string message, params object[] objects) {
            if (socket == null || !socket.Connected) {
                return;
            }
            if (socketLogging.Value) {
                log.LogInfo($"[SOCKET] Sending message \"{message}\" with {objects.Length} objects");
            }
            await socket.EmitAsync(message, objects);
        }

        public void ChangeLevel(string levelName) {
            currentLevel = levelName;
            SendSocketMessage("changeLevel", currentLevel);
        }

        public void StartGame() {
            SendSocketMessage("startGame", currentLevel);
        }

        public void EndGame() {
            SendSocketMessage("endGame");
        }

        public void ToEditMode() {
            inEditMode = true;
            SendSocketMessage("canPlaceItems", inEditMode || canBuildInPlayMode.Value);
        }

        public void ToPlayMode() {
            inEditMode = false;
            SendSocketMessage("canPlaceItems", inEditMode || canBuildInPlayMode.Value);
        }

        public void FindPlaceablePrefabs() {
            this.placeablePrefabs.Clear();

            GameObject[] placeablePrefabs = PlaceableMetadataList.Instance.allBlockPrefabs;
            foreach (var go in placeablePrefabs) {
                this.placeablePrefabs.Add(go.GetComponent<Placeable>());
            }
            log.LogInfo($"Found {this.placeablePrefabs.Count} placeable object prefabs");
        }

        public void PlacePieceFromNetwork(string client, string pieceName, Vector2 location, int rotation, bool flipX, bool flipY) {

            if (!inEditMode && !canBuildInPlayMode.Value) {
                SendSocketMessage("placeResult", client, false);
                return;
            }

            if (placeablePrefabs.Count <= 0) {
                FindPlaceablePrefabs();
            }

            if (pieceName == "Barbed Wire") {
                pieceName = "Barbed Wire x1";
            }

            Placeable piecePrefab = placeablePrefabs.First(p => p.Name == pieceName);
            PickableBlock pickablePiece = Instantiate(piecePrefab.PickableBlock);
            NetworkServer.Spawn(pickablePiece.gameObject);

            PiecePlacementCursorPatch.Event = new PickBlockEvent(1, pickablePiece, null);
            PiecePlacementCursorPatch.Information = new object[] { client, location, rotation, flipX, flipY };
            GameEventManager.SendEvent(PiecePlacementCursorPatch.Event);
        }
    }
}
