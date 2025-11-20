// Utilidades para manejo de archivos
// Será implementado según necesidad
export function getFileExtension(filename) {
    return filename.split('.').pop()?.toLowerCase() || '';
}
export function isValidMimeType(mimeType) {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
    ];
    return allowedTypes.includes(mimeType);
}
//# sourceMappingURL=file.utils.js.map