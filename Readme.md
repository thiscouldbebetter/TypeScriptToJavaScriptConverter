TypeScript to JavaScript Converter
==================================

The program in this repository, when run, allows multiple TypeScript class files contained within an archive file in TAR format to be converted to JavaScript files.

To run:
* Create a .tar archive of the directory structure containing the .ts files to be converted.
* Open the TypeScriptToJavaScriptConverter.html file in a web browser that runs JavaScript.
* Click the button, and upload that .tar file at the prompt.
* Specify a location to download the converted file, also in .tar format.
* Extract the downloaded tar.
* Copy the extracted directory structure to the appropriate place.

Note that the program has no real understanding of TypeScript or JavaScript, it merely identifies and removes the type annotations that distinguish  TypeScript from JavaScript.  A more fully featured compiler/transpiler like TSC should still be used to verify that the TypeScript code is valid.  However, TSC does not preserve whitespace, which is why this  program was written.

More specifically, this program was created to convert a particular TypeScript code repository (namely, the one at "https://github.com/thiscouldbebetter/GameFrameworkTS") to JavaScript, so that it could be used to update the "upstream" JavaScript repository that it was originally ported from (namely, the one at "https://github.com/thiscouldbebetter/GameFramework").  As of this writing, there are some shameful hacks in the conversion, and in any case the conversion process will only likely work well against files that match the author's particular coding standard, which is unlikely to match any wider accepted standards.  It could probably be modified to handle other standards, but in that case it would probably be easier to just use something else.  Presumably something that uses one of those fancy context-free grammars.
