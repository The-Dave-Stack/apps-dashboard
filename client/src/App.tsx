import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-blue-600">AppHub Dashboard</CardTitle>
          <CardDescription className="text-center">Your application dashboard</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">Tailwind CSS components working correctly!</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-3 rounded shadow">
              <h3 className="font-semibold text-blue-500">Feature 1</h3>
              <p className="text-sm text-gray-600">Description here</p>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <h3 className="font-semibold text-blue-500">Feature 2</h3>
              <p className="text-sm text-gray-600">Description here</p>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <h3 className="font-semibold text-blue-500">Feature 3</h3>
              <p className="text-sm text-gray-600">Description here</p>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <h3 className="font-semibold text-blue-500">Feature 4</h3>
              <p className="text-sm text-gray-600">Description here</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => alert('Button clicked!')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Click Me
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;
