using BepInEx;
using BepInEx.Logging;
using HarmonyLib;
using System.Collections.Generic;
using UltimateCrowdControlHorse.Patches;
using UnityEngine;
using UnityEngine.Networking;

namespace UltimateCrowdControlHorse {
    [BepInPlugin(modGUID, "Ultimate Crowd Control Horse", "0.0.1")]
    public class CrowdControlMod : BaseUnityPlugin {

        private const string modGUID = "ipodtouch0218.UccH";
        private readonly Harmony harmony = new Harmony(modGUID);

        public static CrowdControlMod Instance { get; private set; }

        private HashSet<Placeable> placeables = new HashSet<Placeable>();
        private ManualLogSource log;

        public void Awake() {
            if (Instance == null) {
                Instance = this;
            }
            log = BepInEx.Logging.Logger.CreateLogSource(modGUID);

            harmony.PatchAll(typeof(CrowdControlMod));
            harmony.PatchAll(typeof(PlaceableMetadataListPatch));

            log.LogInfo("Ultimate Crowd Control Horse - Initialized");
        }

        public void FindPlaceables() {
            placeables.Clear();

            GameObject[] placeablePrefabs = PlaceableMetadataList.Instance.allBlockPrefabs;
            foreach (var go in placeablePrefabs) {
                placeables.Add(go.GetComponent<Placeable>());
            }
            log.LogInfo($"Found {placeables.Count} placeable objects");
        }

        public void PlacePiece(Placeable piece) {
            // Places a piece on the map...
            MsgPiecePlaced msgPiecePlaced = new MsgPiecePlaced {
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
