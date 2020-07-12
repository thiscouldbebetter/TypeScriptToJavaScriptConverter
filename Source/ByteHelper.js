
class ByteHelper
{
	static bytesToString(bytesToConvert)
	{
		var returnValue = "";

		for (var i = 0; i < bytesToConvert.length; i++)
		{
			var charAsByte = bytesToConvert[i];
			var charAsString = String.fromCharCode(charAsByte);
			returnValue += charAsString;
		}

		return returnValue;
	}

	static stringToBytes(stringToConvert)
	{
		var returnValues = [];

		for (var i = 0; i < stringToConvert.length; i++)
		{
			var charAsBytes = stringToConvert.charCodeAt(i);
			returnValues.push(charAsBytes);
		}

		return returnValues;
	}
}
