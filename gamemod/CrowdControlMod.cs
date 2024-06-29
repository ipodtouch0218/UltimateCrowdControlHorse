using BepInEx;
using BepInEx.Configuration;
using BepInEx.Logging;
using HarmonyLib;
using SocketIOClient;
using SocketIOClient.Newtonsoft.Json;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using UltimateCrowdControlHorse.Patches;
using UnityEngine;
using UnityEngine.Networking;

namespace UltimateCrowdControlHorse {
    [BepInPlugin(modGUID, "Ultimate Crowd Control Horse", "1.1.0")]
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
        public static ConfigEntry<int> additionalCoinsPerRound;
        public static ConfigEntry<bool> unlimitedCoins;

        //---Static
        public static CrowdControlMod Instance { get; private set; }

        //---Properties
        public bool IsConnected => socket != null && socket.Connected;

        //---Variables
        public ManualLogSource log;
        public string room;

        public readonly List<SerializedPlaceable> pendingUpdates = new List<SerializedPlaceable>();
        public readonly List<int> pendingRemovals = new List<int>();
        private readonly HashSet<Placeable> placeablePrefabs = new HashSet<Placeable>();

        private SocketIOUnity socket;
        private string currentLevel;
        private bool inEditMode;



        public void Awake() {
            if (Instance == null) {
                Instance = this;
            }
            log = BepInEx.Logging.Logger.CreateLogSource(modGUID);

            webserverUrl = Config.Bind("General", "webserverUrl", "https://ucch.azurewebsites.net", "The webserver for the crowd control system");

            buildCooldown = Config.Bind("Gameplay", "buildCooldown", 30f, "Length of the cooldown (in seconds) an individual chatter must wait before placing another item");
            canBuildInPlayMode = Config.Bind("Gameplay", "canBuildInPlayMode", false, "Allows chatters to place items while in Play mode");

            minCoins = Config.Bind("Gameplay", "minCoins", 100, "The minimum number of coins an individual chatter will be given. Technically, it raises the actual amount of coins above the total.");
            totalCoins = Config.Bind("Gameplay", "totalCoins", 1000, "The total number of coins the chat splits in a single game.");
            minPrice = Config.Bind("Gameplay", "minPrice", 25, "The minimum price an object can have (based on spawning chances)");
            maxPrice = Config.Bind("Gameplay", "maxPrice", 100, "The maximum price an object can have (based on spawning chances)");
            additionalCoinsPerRound = Config.Bind("Gameplay", "additionalCoinsPerRound", 15, "Gives chatters more coins every round, in case they can't manage their own money...");
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
            socket.OnConnected += (sender, args) => {
                log.LogInfo("[SOCKET] Connected to the UccH webserver");
                SendSocketMessage("join", roomId);
                SendSocketMessage("changeLevel", currentLevel);
                SendSocketMessage("canPlaceItems", currentLevel != null && (inEditMode || canBuildInPlayMode.Value));
                SendSocketMessage("setCoinSettings", minCoins.Value, totalCoins.Value, minPrice.Value, maxPrice.Value, unlimitedCoins.Value, additionalCoinsPerRound.Value);
                UpdatePlaceableSpawnChances();
                PlaceablePatch.UpdateAllPlaceables();

                if (TabletLobbyOptionsScreenPatch.crowdControlUrlText && TabletLobbyOptionsScreenPatch.crowdControlUrlShown) {
                    string url = webserverUrl.Value;
                    if (!url.EndsWith("/")) {
                        url += "/";
                    }
                    url += room;
                    TabletLobbyOptionsScreenPatch.crowdControlUrlText.text = url;
                }
            };
            socket.OnDisconnected += (sender, reason) => {
                log.LogInfo("[SOCKET] Disconnected from the UccH webserver");
                room = null;

                if (TabletLobbyOptionsScreenPatch.crowdControlUrlText && TabletLobbyOptionsScreenPatch.crowdControlUrlShown) {
                    TabletLobbyOptionsScreenPatch.crowdControlUrlText.text = "Not currently connected...";
                }
            };

            socket.OnUnityThread("placeItem", (response) => {
                string clientId = response.GetValue<string>(0);
                string objName = response.GetValue<string>(1);
                float x = response.GetValue<float>(2);
                float y = response.GetValue<float>(3);
                int rotation = response.GetValue<int>(4);
                bool flipX = response.GetValue<bool>(5);
                bool flipY = response.GetValue<bool>(6);

                if (socketLogging.Value) {
                    log.LogInfo($"[SOCKET] Incoming object placement from {clientId}: {objName} at loc: ({x},{y}), rot: {rotation}, flipX: {flipX}, flipY: {flipY}");
                }

                StartCoroutine(PlacePieceFromNetwork(clientId, objName, new Vector2(x, y), rotation, flipX, flipY));
            });

            socket.On("joinedroom", (response) => {
                room = response.GetValue<string>(0);
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
                log.LogInfo($"[SOCKET] Sending message \"{message}\" with parameters \"{socket.JsonSerializer.Serialize(objects).Json}\"");
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
            SendSocketMessage("toEditMode");
            UpdatePlaceableSpawnChances();
        }

        public void ToPlayMode() {
            inEditMode = false;
            SendSocketMessage("canPlaceItems", inEditMode || canBuildInPlayMode.Value);
        }

        private static FieldInfo currentBlockWeightsField;
        private static FieldInfo weightedBlocksField;
        public void UpdatePlaceableSpawnChances() {
            if (!(LobbyManager.instance.CurrentGameController is VersusControl vc)) {
                return;
            }

            vc.PartyBox.ComputeEffectiveBlockWeights();

            if (currentBlockWeightsField == null) {
                currentBlockWeightsField = typeof(PartyBox).GetField("currentBlockWeights", BindingFlags.Instance | BindingFlags.NonPublic);
                weightedBlocksField = typeof(WeightedBlockList).GetField("weightedBlocks", BindingFlags.Instance | BindingFlags.NonPublic);
            }

            WeightedBlockList blockList = (WeightedBlockList) currentBlockWeightsField.GetValue(vc.PartyBox);
            WeightedBlockList.WeightedBlock[] blocks = (WeightedBlockList.WeightedBlock[]) weightedBlocksField.GetValue(blockList);

            // Sort blocks by our own placeables (to remove honey / invalid variants?)
            List<SerializedWeightedBlock> customBlocks = blocks
                .Where(wb => placeablePrefabs.Contains(wb.placeable))
                .Where(wb => wb.weight > 0)
                .Select(wb => new SerializedWeightedBlock(wb))
                .ToList();

            int maxWeight = blocks.Max(wb => wb.weight);
            int minWeight = blocks.Min(wb => wb.weight);

            SendSocketMessage("setPrices", customBlocks, minWeight, maxWeight);
        }

        public void FindPlaceablePrefabs() {
            placeablePrefabs.Clear();

            GameObject[] foundPrefabs = PlaceableMetadataList.Instance.allBlockPrefabs;
            foreach (var go in foundPrefabs) {
                placeablePrefabs.Add(go.GetComponent<Placeable>());
            }
            log.LogInfo($"Found {placeablePrefabs.Count} placeable object prefabs");
        }

        private static readonly WaitForFixedUpdate WaitForFixedUpdate = new WaitForFixedUpdate();
        public IEnumerator PlacePieceFromNetwork(string client, string pieceName, Vector2 location, int rotation, bool flipX, bool flipY) {

            if (!inEditMode && !canBuildInPlayMode.Value) {
                SendSocketMessage("placeResult", client, false);
                yield break;
            }

            if (placeablePrefabs.Count <= 0) {
                FindPlaceablePrefabs();
            }

            Placeable piece = SpawnPlaceable(pieceName, location, rotation, flipX, flipY);
            piece.IgnoreBounds = false;

            // Wait a fixed update or two for collisions to resolve
            yield return WaitForFixedUpdate;
            yield return WaitForFixedUpdate;

            if (piece.CanPlace()) {

                piece.Place(0);

                SpawnPlaceableEvent msgPlaceableSpawned = new SpawnPlaceableEvent() {
                    PrefabName = pieceName,
                    Location = location,
                    Rotation = rotation,
                    FlipX = flipX,
                    FlipY = flipY,
                    ID = piece.ID,
                };
                NetworkServer.SendToAll(SpawnPlaceableEvent.EventId, msgPlaceableSpawned);
                LobbyManager.instance.CurrentGameController.SpawnNetSurrogate(piece.ID);

                if (socketLogging.Value) {
                    log.LogInfo($"[SOCKET] Object placement from {client} succeeded! Sending spawn events to clients...");
                }

                SendSocketMessage("placeResult", client, true, buildCooldown.Value);
            } else {
                if (socketLogging.Value) {
                    log.LogInfo($"[SOCKET] Failed object placement from {client}, CanPlace()==false");
                }

                piece.DestroySelf(true, false, false);
                SendSocketMessage("placeResult", client, false);
            }
        }

        public Placeable SpawnPlaceable(string pieceName, Vector2 location, int rotation, bool flipX, bool flipY, int? id = null) {

            if (pieceName == "Barbed Wire") {
                pieceName = "Barbed Wire x1";
            }

            Placeable piecePrefab = placeablePrefabs.First(p => p.Name == pieceName);
            Placeable piece = Instantiate(piecePrefab);
            piece.SwitchColliderTo(ColliderModeEnum.PlacementPhase);

            if (id.HasValue) {
                piece.ID = id.Value;
            }

            switch (piece) {
                case FerrisWheel w:
                    w.Clockwise = !flipX;
                    flipX = false;
                    break;
                case RotateBlock r:
                    r.Clockwise = !flipX;
                    //flipX = false;
                    break;
                case Bomb b:
                    b.Enable();
                    break;
            }

            piece.transform.position = location;
            piece.transform.rotation = Quaternion.Euler(0f, 0f, Mathf.Round(rotation / 90f) * 90f);
            piece.transform.localScale = new Vector3(flipX ? -1 : 1, flipY ? -1 : 1, 1);

            return piece;
        }
    }
}
