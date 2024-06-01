using UnityEngine;
using UnityEngine.Networking;

namespace UltimateCrowdControlHorse {
    public class SpawnPlaceableEvent : MessageBase {

        public static short EventId = 654;

        public string PrefabName;
        public Vector2 Location;
        public int Rotation;
        public bool FlipX;
        public bool FlipY;

        public override void Serialize(NetworkWriter writer) {
            writer.WritePackedUInt32(1);
            writer.Write(PrefabName);
            writer.Write(Location);
            writer.Write(Rotation);
            writer.Write(FlipX);
            writer.Write(FlipY);
        }

        public override void Deserialize(NetworkReader reader) {
            reader.ReadPackedUInt32();
            PrefabName = reader.ReadString();
            Location = reader.ReadVector2();
            Rotation = reader.ReadInt32();
            FlipX = reader.ReadBoolean();
            FlipY = reader.ReadBoolean();
        }

        public override string ToString() {
            return $"SpawnPlaceableEvent[prefabName: {PrefabName}, location: {Location}, rotation: {Rotation}, flipX: {FlipX}, flipY: {FlipY}]";
        }
    }
}
