using System;
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

        public System.Numerics.Vector2 position;
        public int rotation;
        public System.Numerics.Vector2 localScale;
        public int id;
        public string name;
        public object data;

        public static explicit operator SerializedPlaceable(Placeable placeable) {
            var transform = placeable.transform;

            object data = null;
            if (placeable is Teleporter t) {
                data = new TeleporterData(t);
            } else if (placeable is FerrisWheel w) {
                data = new FerrisWheelData(w);
            }

            return new SerializedPlaceable() {
                position = new System.Numerics.Vector2(transform.position.x, transform.position.y),
                rotation = Mathf.RoundToInt(transform.rotation.eulerAngles.z),
                localScale = new System.Numerics.Vector2(transform.localScale.x, transform.localScale.y),
                id = placeable.ID,
                name = placeable.Name,
                data = data,
            };
        }
    }
}
