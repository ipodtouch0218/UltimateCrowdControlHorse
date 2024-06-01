using System;
using System.Reflection;
using HarmonyLib;
using UnityEngine.Networking;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(LobbyManager))]
    public class LobbyManagerPatch {

        private static LobbyManager currentLobbyManager;

        [HarmonyPatch(nameof(LobbyManager.OnLobbyStartHost))]
        [HarmonyPostfix]
        public static void OnLobbyStartHost_Postfix(LobbyManager __instance) {
            currentLobbyManager = __instance;

            var ccm = CrowdControlMod.Instance;
            if (!__instance.IsInOnlineGame) {
                ccm.log.LogInfo("Offline game; UCCH will be disabled.");
                return;
            }

            // Started the game as the host
            string roomId = Matchmaker.CurrentMatchmakingLobby.GetLobbyCode();
            ccm.ConnectToWebserver(roomId);
        }

        [HarmonyPatch("OnDestroy")]
        [HarmonyPostfix]
        public static void OnDestroy_Postfix(LobbyManager __instance) {
            if (__instance == currentLobbyManager) {
                CrowdControlMod.Instance.DisconnectFromWebserver();
                currentLobbyManager = null;
            }
        }

        [HarmonyPatch("readMessage", new Type[] {typeof(NetworkMessage)} )]
        [HarmonyPrefix]
        public static bool readMessage_Prefix(NetworkMessage msg, ref MessageBase __result) {
            if (msg.msgType == SpawnPlaceableEvent.EventId) {
                __result = msg.ReadMessage<SpawnPlaceableEvent>();

                CrowdControlMod.Instance.log.LogInfo(NetworkServer.handlers[654]);
                return false;
            }

            return true;
        }

        [HarmonyPatch(nameof(LobbyManager.Connect))]
        [HarmonyPostfix]
        public static void Connect(LobbyManager __instance) {

            MethodInfo method = typeof(LobbyManager).GetMethod("distributeMessage", BindingFlags.Instance | BindingFlags.NonPublic);
            Action<NetworkMessage> del = (Action<NetworkMessage>) Delegate.CreateDelegate(typeof(Action<NetworkMessage>), __instance, method);

            NetworkServer.RegisterHandler(SpawnPlaceableEvent.EventId, new NetworkMessageDelegate(del));
            if (__instance.client != null) {
                __instance.client.RegisterHandler(SpawnPlaceableEvent.EventId, new NetworkMessageDelegate(del));
            }
        }
    }
}
