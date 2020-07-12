
class Converter
{
	// constants

	static LineFeed = "\n";
	static Newline = "\r\n";
	static TokenClass = "class";

	// methods

	processFile(file)
	{
		var fileType = file.type;
		if (fileType == "application/x-tar")
		{
			this.convertFile(file);
		}
		else
		{
			alert("Unrecognized file type!");
		}
	}

	convertFile(file)
	{
		var converter = this;
		var fileName = file.name;

		var fileReader = new FileReader();
		fileReader.onload = (event) =>
		{
			var tarFileAsBinaryString = event.target.result;
			var tarFileAsBytes = [];
			for (var i = 0; i < tarFileAsBinaryString.length; i++)
			{
				var byteRead = tarFileAsBinaryString.charCodeAt(i);
				tarFileAsBytes.push(byteRead);
			}
			var tarFile = TarFile.fromBytes(fileName, tarFileAsBytes);
			converter.convertTarFile(tarFile);
		}
		fileReader.readAsBinaryString(file, "UTF-8");
	}

	convertTarFile(tarFileIn)
	{
		var bytesForAllEntriesSoFar = [];

		var tarFileInEntries = tarFileIn.entries;
		tarFileInEntries = tarFileInEntries.filter
		(
			x => (x.isDirectory() == false && x.header.fileName.endsWith(".ts"))
		);
		tarFileInEntries = tarFileInEntries.sort
		(
			(x, y) => (x.header.fileName <= y.header.fileName ? -1 : 1)
		);

		var entriesOut = [];

		for (var i = 0; i < tarFileInEntries.length; i++)
		{
			var entryIn = tarFileInEntries[i];
			var entryInName = entryIn.header.fileName;
			var isEntryATypeScriptFile = entryInName.endsWith(".ts");
			var className = entryInName.split(".ts")[0];
			var entryInDataAsBytes = entryIn.dataAsBytes;
			var entryInDataAsString = ByteHelper.bytesToString(entryInDataAsBytes);

			var entryOutDataAsString = this.convertCode(entryInDataAsString);

			var entryOutDataAsBytes = ByteHelper.stringToBytes(entryOutDataAsString);
			var entryOut = TarFileEntry.fileNew(className + ".js", entryOutDataAsBytes);
			entriesOut.push(entryOut);
		}

		var tarFileOutName = tarFileIn.fileName.split(".tar")[0] + ".tsToJs.tar";
		var tarFileOut = new TarFile(tarFileOutName, entriesOut);

		var tarFileOutAsBytes = tarFileOut.toBytes();
		FileHelper.saveBytesAsFile(tarFileOutAsBytes, tarFileOut.fileName);
	}

	convertCode(textFromFileIn)
	{
		var textFromFileInAsLines = textFromFileIn.split
		(
			Converter.LineFeed
		);

		var lineCount = textFromFileInAsLines.length;

		var linesConverted = [];

		for (var i = 0; i < lineCount; i++)
		{
			var lineFromFileIn = textFromFileInAsLines[i];
			var lineTrimmed = lineFromFileIn.trim();

			if (lineTrimmed.startsWith("interface "))
			{
				while (lineTrimmed.startsWith("}") == false)
				{
					i++;
					lineTrimmed = textFromFileInAsLines[i].trim();
				}
			}
			else if (lineTrimmed.startsWith("class "))
			{
				var lineConverted = lineFromFileIn;

				var indexOfImplements = lineConverted.indexOf(" implements ");
				if (indexOfImplements >= 0)
				{
					lineConverted = lineConverted.substr(0, indexOfImplements);
				}

				var indexOfLessThan = lineConverted.indexOf("<");
				if (indexOfLessThan >= 0)
				{
					lineConverted = lineConverted.substr(0, indexOfLessThan);
				}

				linesConverted.push(lineConverted);
			}
			else if (lineTrimmed.startsWith(":"))
			{
				// hack - Likely a multi-line ternary operator, not a type annotation.
				var lineConverted = lineFromFileIn.split(":").join("colon");
				lineConverted = this.convertLine(lineConverted);
				lineConverted = lineFromFileIn.split("colon").join(":");
				linesConverted.push(lineConverted);
			}
			else
			{
				var lineConverted = this.convertLine(lineFromFileIn);
				linesConverted.push(lineConverted);
			}
		}

		var textConverted = linesConverted.join("\n");

		return textConverted;
	}

	convertLine(lineToConvert)
	{
		var lineTrimmed = lineToConvert.trim();
		var lineConverted = "";

		var textPrivate = "private";
		if (lineTrimmed.startsWith(textPrivate))
		{
			lineToConvert = lineToConvert.split(textPrivate).join("");
		}
		var inPossibleTypeAnnotation = false;
		var inStringLiteral = false;
		var inTernaryOperator = false;

		var charsInPossibleTypeAnnotation = "";

		for (var i = 0; i < lineToConvert.length; i++)
		{
			var char = lineToConvert[i];

			if (inStringLiteral)
			{
				lineConverted += char;
				if (char == ("\\"))
				{
					// Escaped char.
					i++;
					lineConverted += lineToConvert[i];
				}
				else if (char == "\"")
				{
					inStringLiteral = false;
				}
			}
			else if (inPossibleTypeAnnotation)
			{
				charsInPossibleTypeAnnotation += char;

				if (char == "(")
				{
					var lambdaArrow = "=>";
					var indexOfNextLambdaArrow = lineToConvert.indexOf(lambdaArrow, i);
					if (indexOfNextLambdaArrow >= 0)
					{
						i = indexOfNextLambdaArrow + lambdaArrow.length;
					}
				}
				else if (char == "<")
				{
					var iBeforePossibleGeneric = i;
					var depthIntoPossibleGeneric = 1;
					var possibleGenericAsString = "<";
					var j = i + 1;
					while (depthIntoPossibleGeneric > 0 && j < lineToConvert.length)
					{
						char = lineToConvert[j];
						possibleGenericAsString += char;
						if (char == ">")
						{
							depthIntoPossibleGeneric--;
						}
						else if (char == "<")
						{
							depthIntoPossibleGeneric++;
						}
						j++;
					}

					// hack
					var isActuallyGeneric =
						depthIntoPossibleGeneric == 0
						&& possibleGenericAsString.indexOf("&") == -1
						&& possibleGenericAsString.indexOf("|") == -1;

					if (isActuallyGeneric)
					{
						i = j - 1;
					}
					else
					{
						lineConverted += "<";
						i = iBeforePossibleGeneric;
					}
				}
				else if (char == "," || char == ";" || char == ")" || char == "=")
				{
					lineConverted += char;
					inPossibleTypeAnnotation = false;
				}
			}
			else if (inTernaryOperator)
			{
				lineConverted += char;

				if (char == ":")
				{
					inTernaryOperator = false;
				}
			}
			else if (char == "?")
			{
				lineConverted += char;
				inTernaryOperator = true;
			}
			else if (char == ":")
			{
				inPossibleTypeAnnotation = true;
				charsInPossibleTypeAnnotation = char;
			}
			else if (char == "a")
			{
				// "as" - Type-casting.
				var isAs =
				(
					lineToConvert[i - 1] == " "
					&& lineToConvert[i + 1] == "s"
					&& lineToConvert[i + 2] == " "
				);
				if (isAs)
				{
					inPossibleTypeAnnotation = true;
					i += "as".length;
					charsInPossibleTypeAnnotation = "";
				}
				else
				{
					lineConverted += char;
				}
			}
			else if (char == "<")
			{
				// todo - Fix duplicated code.
				// Already been bitten once by it.
				var iBeforePossibleGeneric = i;
				var depthIntoPossibleGeneric = 1;
				var possibleGenericAsString = "<";
				var j = i + 1;
				while (depthIntoPossibleGeneric > 0 && j < lineToConvert.length)
				{
					char = lineToConvert[j];
					possibleGenericAsString += char;
					if (char == ">")
					{
						depthIntoPossibleGeneric--;
					}
					else if (char == "<")
					{
						depthIntoPossibleGeneric++;
					}
					j++;
				}

				// hack
				var isActuallyGeneric =
					depthIntoPossibleGeneric == 0
					&& possibleGenericAsString.indexOf("&") == -1
					&& possibleGenericAsString.indexOf("|") == -1;

				if (isActuallyGeneric)
				{
					i = j - 1;
				}
				else
				{
					lineConverted += "<";
					i = iBeforePossibleGeneric;
				}
			}
			else if (char == "\"")
			{
				inStringLiteral = true;
				lineConverted += char;
			}
			else
			{
				lineConverted += char;
			}
		}

		return lineConverted;
	}
}
