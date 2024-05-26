using HarmonyLib;

namespace UltimateCrowdControlHorse.Patches {
    [HarmonyPatch(typeof(LobbyManager))]
    public class LobbyManagerPatch {

        [HarmonyPatch(nameof(LobbyManager.OnLobbyStartHost))]
        [HarmonyPostfix]
        public static void OnLobbyStartHost_Postfix(LobbyManager __instance) {
            if (!__instance.IsInOnlineGame) {
                CrowdControlMod.Instance.log.LogInfo("Offline game; UCCH will be disabled.");
                return;
            }

            // Started the game as the host
            string roomId = Matchmaker.CurrentMatchmakingLobby.GetLobbyCode();
            CrowdControlMod.Instance.log.LogInfo($"Detected the starting of a game with ID {roomId}");
            CrowdControlMod.Instance.ConnectToWebserver(roomId);
        }
    }
}
