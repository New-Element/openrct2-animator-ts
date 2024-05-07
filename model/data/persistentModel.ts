export default interface PersistentModel {
    getDataToPersist: () => object
}