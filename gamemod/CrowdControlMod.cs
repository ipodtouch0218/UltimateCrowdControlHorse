using BepInEx;
using BepInEx.Configuration;
using BepInEx.Logging;
using HarmonyLib;
using SocketIOClient;
using SocketIOClient.Newtonsoft.Json;
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

namespace UltimateCrowdControlHorse {
    [BepInPlugin(modGUID, "Ultimate Crowd Control Horse", "0.0.1")]
    public class CrowdControlMod : BaseUnityPlugin {

        private const string modGUID = "ipodtouch0218.UccH";
        private readonly Harmony harmony = new Harmony(modGUID);

        //---Configuration
        private static ConfigEntry<string> webserverUrl;
        private static ConfigEntry<bool> socketLogging;

        //---Static
        public static CrowdControlMod Instance { get; private set; }

        //---Variables
        public ManualLogSource log;
        private HashSet<Placeable> placeablePrefabs = new HashSet<Placeable>();
        private SocketIOUnity socket;
        private string roomId;

        public void Awake() {
            if (Instance == null) {
                Instance = this;
            }
            log = BepInEx.Logging.Logger.CreateLogSource(modGUID);

            webserverUrl = Config.Bind("General", "webserverUrl", "http://localhost:3000/", "The webserver for the crowd control system");
            socketLogging = Config.Bind("Debug", "socketLogging", true, "Logs all incoming/outgoing socket messages to the console");

            harmony.PatchAll();
            log.LogInfo("Ultimate Crowd Control Horse (UccH) Initialized!");
        }

        public void ConnectToWebserver(string roomId) {
            socket = new SocketIOUnity(webserverUrl.Value, new SocketIOOptions {
                EIO = 4,
                Transport = SocketIOClient.Transport.TransportProtocol.WebSocket
            });
            socket.JsonSerializer = new NewtonsoftJsonSerializer();
            socket.OnConnected += (object sender, EventArgs e) => {
                log.LogInfo("Connected to the UccH webserver!");
                SendSocketMessage("join", roomId);
            };

            log.LogInfo("Attempting to connect to the UccH webserver...");
            socket.Connect();

            //if (socketLogging.Value) {
                socket.OnAny((sender, e) => {
                    log.LogInfo($"[SOCKET] From {sender}: {e}");
                });
            //}
        }

        public void DisconnectFromWebserver() {
            if (socket == null) {
                return;
            }

            socket.Disconnect();
            socket = null;
        }

        public async void SendSocketMessage(string message, params object[] objects) {
            if (socket == null) {
                return;
            }
            log.LogInfo($"Sending socket message {message}...");
            await socket.EmitAsync(message, objects);
        }

        public void FindPlaceablePrefabs() {
            this.placeablePrefabs.Clear();

            GameObject[] placeablePrefabs = PlaceableMetadataList.Instance.allBlockPrefabs;
            foreach (var go in placeablePrefabs) {
                this.placeablePrefabs.Add(go.GetComponent<Placeable>());
            }
            log.LogInfo($"Found {this.placeablePrefabs.Count} placeable object prefabs");
        }

        public void PlacePiece(Placeable piece) {
            // Places a piece on the map...
            MsgPiecePlaced msgPiecePlaced = new MsgPiecePlaced() {
                PlayerNumber = -1,
                PiecePosition = piece.transform.position,
                PieceScale = piece.transform.localScale,
                PieceRotation = piece.transform.rotation,
                PieceID = piece.ID,
                PieceWasMoved = piece.Placed
            };
            NetworkManager.singleton.client.Send(NetMsgTypes.PiecePlaced, msgPiecePlaced);
        }
    }
}
