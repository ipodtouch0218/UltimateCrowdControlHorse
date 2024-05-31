using System;
using System.Collections.Generic;
using UnityEngine;

namespace UltimateCrowdControlHorse {

    [Serializable]
    public class TeleporterData {
        public bool linked;
        public float h, s, v;

        public TeleporterData(Teleporter t) {
            linked = t.Destination;
            Color.RGBToHSV(t.grid.color, out h, out s, out v);
        }
    }

    [Serializable]
    public class FerrisWheelData {
        public bool[] platforms;

        public FerrisWheelData(FerrisWheel w) {
            platforms = new bool[4];
            for (int i = 0; i < 4; i++) {
                platforms[i] = w.PivotsRb[i];
            }
        }
    }

    [Serializable]
    public class SerializedPlaceable {

        public float[] pos;
        public int rot;
        public float[] scale;
        public int id;
        public string name;
        public object data;

        public SerializedPlaceable(Placeable placeable) {

            object objData = null;
            switch (placeable) {
                case Teleporter t: objData = new TeleporterData(t);
                    break;
                case FerrisWheel w: objData = new FerrisWheelData(w);
                    break;
            }

            pos = new float[] { placeable.OriginalPosition.x, placeable.OriginalPosition.y };
            rot = Mathf.RoundToInt(placeable.OriginalRotation.eulerAngles.z);
            scale = new float[] { placeable.OriginalScale.x, placeable.OriginalScale.y };
            id = placeable.ID;
            name = placeable.Name;
            data = objData;

            // Exceptions:
            if (placeable.name.StartsWith("IcePiece")) {
                name = "Ice";
            }
        }

        private static List<string> invalidNames = new List<string>(){ "Double Ice", "Triple Ice", "Barbed Wire x3", "Barbed Wire x2", "Barbed Wire x1" };

        public static bool IsValid(Placeable p) {
            return (!string.IsNullOrEmpty(p.Name) || p.name.StartsWith("IcePiece")) && !invalidNames.Contains(p.Name) && p.Placed && !p.PickedUp && !p.isSetPiece && p.Enabled;
        }
    }
}
