using HarmonyLib;

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
    }
}
