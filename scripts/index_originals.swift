import Foundation
import PDFKit
import Vision
import AppKit

let arguments = CommandLine.arguments.dropFirst()
for argument in arguments {
    let url = URL(fileURLWithPath: argument)
    let name = url.deletingPathExtension().lastPathComponent
    let directory = URL(fileURLWithPath: "data/original-index")
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    let output = directory.appendingPathComponent(name + ".json")
    if FileManager.default.fileExists(atPath: output.path) { continue }
    guard let document = PDFDocument(url: url) else { fatalError(argument) }
    var pages: [[String: Any]] = []
    let imageDirectory = URL(fileURLWithPath: "public/ipa/originals/" + name)
    try FileManager.default.createDirectory(at: imageDirectory, withIntermediateDirectories: true)
    for pageIndex in 0..<document.pageCount {
        autoreleasepool {
            guard let page = document.page(at: pageIndex) else { return }
            let bounds = page.bounds(for: .mediaBox)
            let size = NSSize(width: bounds.width * 2, height: bounds.height * 2)
            let image = page.thumbnail(of: size, for: .mediaBox)
            guard let tiff = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff), let cg = bitmap.cgImage else { return }
            let filename = String(format: "%02d.jpg", pageIndex + 1)
            try! bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.84])!.write(to: imageDirectory.appendingPathComponent(filename))
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.recognitionLanguages = ["ja-JP", "en-US"]
            request.usesLanguageCorrection = false
            try! VNImageRequestHandler(cgImage: cg).perform([request])
            let lines = (request.results ?? []).compactMap { observation -> [String: Any]? in
                guard let candidate = observation.topCandidates(1).first else { return nil }
                let box = observation.boundingBox
                return ["text": candidate.string, "x": box.minX, "y": 1-box.maxY, "w": box.width, "h": box.height]
            }
            pages.append(["page": pageIndex+1, "src": "/ipa/originals/" + name + "/" + filename, "lines": lines])
        }
    }
    let data = try JSONSerialization.data(withJSONObject: pages, options: [.prettyPrinted, .sortedKeys])
    try data.write(to: output)
    print("Indexed \(name): \(pages.count) pages")
}
