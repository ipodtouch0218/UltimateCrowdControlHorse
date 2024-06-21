using System;

namespace UltimateCrowdControlHorse {
    [Serializable]
    public struct SerializedWeightedBlock {

        public string Name;
        public int Weight;

        public SerializedWeightedBlock(WeightedBlockList.WeightedBlock wb) {
            Name = wb.placeable.Name;
            Weight = wb.weight;

            if (Name == "Barbed Wire x1") {
                Name = "Barbed Wire";
            }
        }
    }
}
